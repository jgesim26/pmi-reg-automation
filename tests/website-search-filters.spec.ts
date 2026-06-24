import { test, expect } from '@playwright/test'
import { Filters } from '../pages/Filters'
import { recordRoute } from './url-annotation'

recordRoute()

/**
 * Website-search grid filters.
 *
 * The grid keeps its full filter state in the URL query string
 * (`location_id`, `level`, `verticals=[...]`, etc.), so the filters are
 * asserted against the URL (the source of truth) plus the rendered result
 * rows. Drives the controls via the shared `Filters` page object.
 */
test.describe('Website-search filters', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000)
    await new Filters(page).gotoWebsiteSearch()
  })

  test('loads with default filter state and populated results', async ({ page }) => {
    const filters = new Filters(page)
    // Default state is encoded in the URL.
    await expect(page).toHaveURL(/location_id=\d+/)
    await expect(page).toHaveURL(/level=website/)
    // Grid renders rows.
    expect(await filters.resultRowCount(), 'grid should render result rows').toBeGreaterThan(0)
  })

  test('Verticals multi-select writes its selection into the URL', async ({ page }) => {
    const filters = new Filters(page)
    const picked = await filters.pickMultiSelectOption(/Verticals/i, /^Casino$/i)
    expect(picked, 'the Casino vertical option should be selectable').toBe(true)
    // Selecting a vertical adds a `verticals=[...]` param to the URL.
    await expect(page).toHaveURL(/verticals=/)
    // Grid still renders rows after filtering.
    expect(await filters.resultRowCount(), 'grid should still show rows after filtering').toBeGreaterThan(0)
  })

  test('Location filter (URL param) reloads the grid', async ({ page }) => {
    const filters = new Filters(page)
    const before = await filters.resultRowCount()
    expect(before, 'grid should start with rows').toBeGreaterThan(0)

    // Switch location via the deterministic URL param and confirm it sticks.
    const TARGET = 2
    const changed = await filters.setLocationViaUrl(TARGET)
    expect(changed, 'website-search URL should carry a location_id param').toBe(true)
    expect(filters.hasLocationId(TARGET), 'URL should reflect the new location_id').toBe(true)
    // Grid re-renders with data for the new location.
    expect(await filters.resultRowCount(), 'grid should render rows after location change').toBeGreaterThan(0)
  })

  test('Search-website box keeps the grid functional', async ({ page }) => {
    const filters = new Filters(page)
    await filters.searchWebsite('bet')
    // The search must not break the grid: a table is still present with rows.
    await expect(page.locator('table').first()).toBeVisible()
    expect(await filters.resultRowCount(), 'grid should still render rows after a search').toBeGreaterThan(0)
  })

  // Single-pick filters that each write a distinct param into the URL.
  const URL_FILTERS = [
    { name: 'Regulation', field: /Regulation/i, option: /^Regulated$/i, param: /spectrum=licensed/ },
    { name: 'Media Websites', field: /Media Websites/i, option: /^Media Websites$/i, param: /media_sites=only/ },
    { name: 'Crypto Friendly Options', field: /Crypto Friendly/i, option: /^Crypto-friendly Website$/i, param: /crypto_friendly=only/ },
  ]

  for (const f of URL_FILTERS) {
    test(`${f.name} filter writes its selection into the URL`, async ({ page }) => {
      const filters = new Filters(page)
      const picked = await filters.pickMultiSelectOption(f.field, f.option)
      expect(picked, `the ${f.name} option should be selectable`).toBe(true)
      await expect(page).toHaveURL(f.param)
      expect(await filters.resultRowCount(), 'grid should still show rows after filtering').toBeGreaterThan(0)
    })
  }

  test('Brand "Doesn\'t have" toggle flips the brand-found URL param', async ({ page }) => {
    const filters = new Filters(page)
    // Default: matched sites must *have* the first brand.
    await expect(page).toHaveURL(/first_brand_found_option=1/)

    const toggled = await filters.setBrandPresence('Brand', false)
    expect(toggled, 'the Brand "Doesn\'t have" toggle should be available').toBe(true)
    // Toggling to "Doesn't have" flips the param to 0.
    await expect(page).toHaveURL(/first_brand_found_option=0/)
    expect(await filters.resultRowCount(), 'grid should still show rows after the brand toggle').toBeGreaterThan(0)
  })

  test('pagination loads a different result set', async ({ page }) => {
    const filters = new Filters(page)
    const firstPage = await filters.firstRowText()
    expect(firstPage.length, 'page 1 should have a leading row').toBeGreaterThan(0)

    await filters.goToResultPage(2)
    const secondPage = await filters.firstRowText()
    expect(secondPage.length, 'page 2 should have a leading row').toBeGreaterThan(0)
    expect(secondPage, 'page 2 should show different rows than page 1').not.toBe(firstPage)
  })
})
