import { test, expect } from '@playwright/test'
import { ModulePage } from '../pages/ModulePage'
import { Filters } from '../pages/Filters'
import { MODULES } from './modules.data'
import { recordRoute } from './url-annotation'

recordRoute()

/**
 * Multi-brand / location coverage. Runs key modules across several locations
 * (driven via the URL location_id param) and a different brand (driven via the
 * Brands select), verifying each selection loads without errors. Data may
 * legitimately be empty for some selections, so row counts are logged, not
 * asserted — the assertions are: filter applied + no fatal error + content shell.
 */

const LOCATIONS = [
  { id: 0, name: 'Global' },
  { id: 1, name: 'USA' },
  { id: 12, name: 'Mexico' },
]

// Curated table modules that carry a numeric/word location_id in the URL.
// (Keyword Search is excluded: it's a search page that normalises location away.)
const LOCATION_KEYS = ['brand-top-list', 'website-top-list', 'trending-websites', 'your-websites', 'keyword-list', 'brand-bidding']
const locationModules = MODULES.filter((m) => LOCATION_KEYS.includes(m.key))

// Modules with a Brands select to exercise a brand switch (UI-driven).
const BRAND_KEYS = ['trending-websites', 'kick-channels']
const brandModules = MODULES.filter((m) => BRAND_KEYS.includes(m.key))

async function noFatalError(page: import('@playwright/test').Page): Promise<boolean> {
  return !(await page
    .getByText(/something went wrong|internal server error|unexpected error|failed to load|access denied/i)
    .first()
    .isVisible()
    .catch(() => false))
}

test.describe('Matrix — locations', () => {
  for (const m of locationModules) {
    for (const loc of LOCATIONS) {
      test(`${m.name} @ ${loc.name}`, async ({ page }) => {
        test.setTimeout(90000)
        const mod = new ModulePage(page)
        const filters = new Filters(page)

        await mod.load(m.route)
        const applied = await filters.setLocationViaUrl(loc.id)
        expect(applied, `${m.name} should expose a location filter`).toBeTruthy()
        expect(filters.hasLocationId(loc.id), `URL should carry location_id=${loc.id}`).toBeTruthy()

        expect(await noFatalError(page), `no fatal error for ${m.name} @ ${loc.name}`).toBeTruthy()
        await expect(page.getByRole('table').first(), `table should render for ${m.name} @ ${loc.name}`).toBeVisible({ timeout: 20000 })

        const rows = await page.locator('table tbody tr').filter({ hasText: /\S/ }).count()
        console.log(`   📍 ${m.name} @ ${loc.name} (id=${loc.id}): ${rows} row(s)${rows === 0 ? ' (no data for this location — OK)' : ''}`)
        await page.screenshot({ path: `./screenshots/matrix-${m.key}-loc-${loc.id}.png`, fullPage: true }).catch(() => {})
      })
    }
  }
})

test.describe('Matrix — brands', () => {
  for (const m of brandModules) {
    test(`${m.name} — switch brand`, async ({ page }) => {
      test.setTimeout(90000)
      const mod = new ModulePage(page)
      const filters = new Filters(page)

      await mod.load(m.route)
      const chosen = await filters.pickDifferentBrand()
      if (!chosen) {
        console.log(`   ⚠️ ${m.name}: no selectable brand option found — skipping brand switch`)
        test.skip(true, 'no brand select/options available')
        return
      }
      console.log(`   🏷️ ${m.name}: switched brand to "${chosen}"`)
      expect(await noFatalError(page), `no fatal error after switching brand on ${m.name}`).toBeTruthy()
      await expect(page.getByRole('table').first(), `table should render after brand switch on ${m.name}`).toBeVisible({ timeout: 20000 })

      const rows = await page.locator('table tbody tr').filter({ hasText: /\S/ }).count()
      console.log(`   🏷️ ${m.name} @ brand "${chosen}": ${rows} row(s)`)
      await page.screenshot({ path: `./screenshots/matrix-${m.key}-brand.png`, fullPage: true }).catch(() => {})
    })
  }
})
