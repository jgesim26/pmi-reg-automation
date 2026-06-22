import { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Drives the brand / location filters for the multi-brand/location matrix.
 *
 * Location is driven via the URL `location_id` param (deterministic and robust);
 * Brand is driven via the in-page "Brands" select (UI), since brand ids are opaque.
 */
export class Filters extends BasePage {
  private get main(): Locator {
    return this.page.locator('main, [role="main"], .q-page-container').first()
  }

  private async settle() {
    await this.page
      .locator('table, .q-card, h1, h2')
      .first()
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => {})
    await this.page.waitForTimeout(1500)
  }

  /**
   * Set the location by rewriting every `location_id=<n>` in the current URL and
   * reloading. Returns false when the page has no location_id param.
   */
  async setLocationViaUrl(locationId: number): Promise<boolean> {
    const url = this.page.url()
    // Matches numeric ids and word defaults like `location_id=pref`/`all`.
    if (!/location_id=[^&]+/.test(url)) return false
    const newUrl = url.replace(/location_id=[^&]+/g, `location_id=${locationId}`)
    await this.page.goto(newUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await this.settle()
    return true
  }

  /** Whether the current URL reflects the given location id. */
  hasLocationId(locationId: number): boolean {
    return new RegExp(`location_id=${locationId}(?:&|$)`).test(this.page.url())
  }

  /**
   * Open the "Brands" select and choose a concrete brand option (skipping
   * select-all / "Your Brands"). Returns the chosen label, or null if no brand
   * select / options were found.
   */
  async pickDifferentBrand(): Promise<string | null> {
    const brandSel = this.main.locator('.q-select').filter({ hasText: /Brands/ }).first()
    if (!(await brandSel.count())) return null
    await brandSel.click().catch(() => {})
    await this.page.waitForTimeout(800)
    const options = this.page.locator('.q-menu .q-item, .q-menu [role="option"]')
    const oc = await options.count()
    for (let i = 0; i < oc; i++) {
      const label = (await options.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
      if (label && !/select all|your brands|all brands/i.test(label)) {
        await options.nth(i).click().catch(() => {})
        await this.page.waitForTimeout(1800)
        await this.page.keyboard.press('Escape').catch(() => {})
        return label
      }
    }
    await this.page.keyboard.press('Escape').catch(() => {})
    return null
  }
}
