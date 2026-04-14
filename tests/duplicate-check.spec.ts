import { test, expect } from '@playwright/test'

test('Scan for duplicate High Value KWs in modal', async ({ page }) => {
  await page.goto('https://stage.app.deepci.com/ppc/weekly/brand-top-list')

  await page.fill('input[type="email"], input[name="username"]', 'jayson.gesim@everymatrix.com')
  await page.fill('input[type="password"]', '12345678')
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => url.href.includes('brand-top-list'))

  const highValueKWCell = page.locator('td').filter({ hasText: /^\d+$/ }).first()
  await highValueKWCell.click()

  const modal = page.locator('[role="dialog"], .modal-body, .ant-modal-content')
  await expect(modal).toBeVisible()

  const keywordMap = new Map<string, number[]>()
  let currentPage = 1
  let hasNextPage = true

  while (hasNextPage) {
    console.log(`Scanning page ${currentPage}...`)

    const rows = modal.locator('table tbody tr')
    await rows.first().waitFor({ state: 'visible' })

    const count = await rows.count()

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(0).innerText()
      const keyword = text.trim()

      if (keyword) {
        const existing = keywordMap.get(keyword) || []
        keywordMap.set(keyword, [...existing, currentPage])
      }
    }

    const nextButton = modal.locator(
      'li[title="Next Page"], button:has-text("Next"), .ant-pagination-next:not(.ant-pagination-disabled)',
    )

    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      await nextButton.click()
      currentPage++

      await page.waitForTimeout(1500)
    } else {
      hasNextPage = false
    }
  }

  console.log('\n--- Duplicate Report ---')
  let found = false
  for (const [keyword, pages] of keywordMap.entries()) {
    if (pages.length > 1) {
      found = true
      console.log(`Keyword: "${keyword}" | Found on pages: ${pages.join(', ')}`)
    }
  }

  if (!found) console.log('No duplicates detected.')
})
