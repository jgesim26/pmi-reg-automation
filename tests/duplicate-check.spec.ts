import { test, expect, Page, Locator } from '@playwright/test'

const PER_PAGE = 1000 // page size for the API crawl (kept high to minimise requests)
const MAX_REPORTED = 50 // cap how many duplicates we print to keep output readable

/** Resolve the column index of a header whose text matches `pattern` (or -1). */
async function findColumnIndex(headerCells: Locator, pattern: RegExp): Promise<number> {
  const headers = await headerCells.allInnerTexts()
  return headers.findIndex((text) => pattern.test(text.trim()))
}

test('Scan for duplicate High Value KWs across the full keyword list', async ({ page }) => {
  test.setTimeout(120000)

  // Capture the keyword-list API request the dialog fires (URL + bearer token).
  // The detail table is server-paginated, so we crawl it via its own API rather
  // than clicking through hundreds of UI pages.
  let keywordsUrl = ''
  let authHeader = ''
  page.on('request', (req) => {
    const u = req.url()
    if (/\/keywords\?/.test(u) && !/no-times-found/.test(u)) {
      keywordsUrl = u
      authHeader = req.headers()['authorization'] || authHeader
    }
  })

  // Auth comes from the shared storageState (auth.setup.ts) — no manual login.
  await page.goto('/ppc/weekly/brand-top-list')

  // Open the "High Value KWs" dialog for the first brand row to trigger the API.
  const table = page.getByRole('table').first()
  await table.locator('tbody tr').filter({ hasText: /\S/ }).first().waitFor({ state: 'visible', timeout: 30000 })
  const colIndex = await findColumnIndex(table.locator('thead th'), /high value/i)
  expect(colIndex, 'Could not find the "High Value KWs" column header').toBeGreaterThanOrEqual(0)

  const firstRow = table.locator('tbody tr').filter({ hasText: /\S/ }).first()
  const brand = (await firstRow.locator('td').first().innerText()).split('\n')[0].trim()
  await firstRow.locator('td').nth(colIndex).locator('.pmi-link-blue, a').first().click()
  await expect(page.locator('.q-dialog').first()).toBeVisible({ timeout: 15000 })

  // Wait until the request listener has captured the endpoint + token.
  await expect.poll(() => keywordsUrl, { timeout: 15000, message: 'keyword API request not seen' }).not.toBe('')
  expect(authHeader, 'No Authorization header captured from the keyword request').not.toBe('')
  const headers = { authorization: authHeader }

  // Total row count from the count endpoint — used to prove we crawl everything.
  const countUrl = keywordsUrl.replace('/keywords?', '/keywords/count?')
  const countResp = await page.request.get(countUrl, { headers })
  expect(countResp.ok(), `count endpoint failed: ${countResp.status()}`).toBeTruthy()
  const totalExpected = parseInt((await countResp.text()).trim(), 10)
  console.log(`\nBrand: ${brand} — server reports ${totalExpected} keyword row(s) to crawl.`)

  // Crawl every page until we've collected all rows.
  const allRows: Array<Record<string, unknown>> = []
  for (let pageNum = 1; allRows.length < totalExpected; pageNum++) {
    const pageUrl = keywordsUrl
      .replace(/per_page=\d+/, `per_page=${PER_PAGE}`)
      .replace(/([?&])page=\d+/, `$1page=${pageNum}`)
    const resp = await page.request.get(pageUrl, { headers })
    expect(resp.ok(), `keywords page ${pageNum} failed: ${resp.status()}`).toBeTruthy()
    const batch = (await resp.json()) as Array<Record<string, unknown>>
    if (!Array.isArray(batch) || batch.length === 0) break
    allRows.push(...batch)
    console.log(`  page ${pageNum}: +${batch.length} (total ${allRows.length}/${totalExpected})`)
  }

  // Proof of full coverage: we fetched as many rows as the server says exist.
  expect(
    allRows.length,
    `Crawled ${allRows.length} rows but server reports ${totalExpected}`,
  ).toBe(totalExpected)

  // Count keyword occurrences across ALL rows. Same keyword anywhere = duplicate.
  const occurrences = new Map<string, number>()
  for (const row of allRows) {
    const keyword = String(row.keyword ?? '').trim().toLowerCase()
    if (keyword) occurrences.set(keyword, (occurrences.get(keyword) ?? 0) + 1)
  }

  const duplicates = [...occurrences.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])

  console.log('\n--- Duplicate Report ---')
  console.log(
    `Crawled ${allRows.length} rows, ${occurrences.size} unique keyword(s), ${duplicates.length} duplicated.`,
  )
  for (const [keyword, n] of duplicates.slice(0, MAX_REPORTED)) {
    console.log(`  "${keyword}" x${n}`)
  }
  if (duplicates.length > MAX_REPORTED) {
    console.log(`  ...and ${duplicates.length - MAX_REPORTED} more (showing top ${MAX_REPORTED}).`)
  }
  if (duplicates.length === 0) console.log('✅ No duplicate keywords found.')

  // A keyword appearing in more than one row is a duplicate — fail and surface them.
  const examples = duplicates.slice(0, 10).map(([k, n]) => `${k} (x${n})`).join(', ')
  expect(
    duplicates.length,
    `Found ${duplicates.length} duplicate keyword(s) across ${allRows.length} rows. Examples: ${examples}`,
  ).toBe(0)
})
