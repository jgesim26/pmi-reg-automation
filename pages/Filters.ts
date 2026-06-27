import { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Drives the brand / location filters for the multi-brand/location matrix.
 *
 * Location is driven via the URL `location_id` param (deterministic and robust);
 * Brand is driven via the in-page "Brands" select (UI), since brand ids are opaque.
 */
/** Route for the organic-traffic website-search grid (filter-heavy page). */
export const WEBSITE_SEARCH_ROUTE = '/organic-traffic/market-research/website-search'

/** Outcome of exercising a single filter control on a module page. */
export interface FilterResult {
  label: string
  found: boolean
  opened: boolean
  picked: string | null
  changed: boolean
  errored: boolean
}

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

  // ---------------------------------------------------------------------------
  // Website-search grid helpers
  // ---------------------------------------------------------------------------

  /** Open the website-search grid and wait for the results table to settle. */
  async gotoWebsiteSearch(): Promise<void> {
    await this.page.goto(WEBSITE_SEARCH_ROUTE, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await this.settle()
  }

  /** Number of visible result rows in the grid (0 if no table yet). */
  async resultRowCount(): Promise<number> {
    return this.main.locator('table tbody tr:visible').count().catch(() => 0)
  }

  /**
   * Open a labelled multi-select filter (e.g. "Verticals", "Regulation") and
   * click the option whose text matches `option`. Returns false when the select
   * or the option could not be found.
   */
  async pickMultiSelectOption(field: RegExp, option: RegExp): Promise<boolean> {
    const select = this.main.locator('.q-select').filter({ hasText: field }).first()
    if (!(await select.count())) return false
    await select.click().catch(() => {})
    await this.page.waitForTimeout(900)
    const opt = this.page.locator('.q-menu .q-item, .q-menu [role="option"]').filter({ hasText: option }).first()
    if (!(await opt.count())) {
      await this.page.keyboard.press('Escape').catch(() => {})
      return false
    }
    await opt.click().catch(() => {})
    await this.page.waitForTimeout(1800)
    await this.page.keyboard.press('Escape').catch(() => {})
    return true
  }

  /** Type a query into the "Search website" box and submit it with Enter. */
  async searchWebsite(query: string): Promise<void> {
    const box = this.main.locator('input[placeholder="Search website" i]').first()
    await box.fill(query)
    await box.press('Enter')
    await this.page.waitForTimeout(2000)
  }

  /**
   * Open a brand combobox ("Brand" or "Second Brand") and set whether matched
   * websites must *have* or *not have* a brand, via the "Does have" /
   * "Doesn't have" toggle. Drives the `{first,second}_brand_found_option` URL
   * param (1 = has, 0 = doesn't). Returns false if the combobox is absent.
   */
  async setBrandPresence(comboboxName: 'Brand' | 'Second Brand', present: boolean): Promise<boolean> {
    const combo = this.page.getByRole('combobox', { name: comboboxName, exact: true }).first()
    if (!(await combo.count())) return false
    await combo.click({ timeout: 5000 }).catch(() => {})
    await this.page.waitForTimeout(1200)
    const btn = this.page.getByRole('button', { name: present ? /^Does have$/i : /Doesn't have/i }).first()
    if (!(await btn.count())) {
      await this.page.keyboard.press('Escape').catch(() => {})
      return false
    }
    await btn.click({ timeout: 5000 }).catch(() => {})
    await this.page.waitForTimeout(1800)
    await this.page.keyboard.press('Escape').catch(() => {})
    await this.page.waitForTimeout(1000)
    return true
  }

  /** Collapsed text of the first visible result row (for change detection). */
  async firstRowText(): Promise<string> {
    return this.main
      .locator('table tbody tr:visible')
      .first()
      .innerText()
      .catch(() => '')
      .then((s) => s.replace(/\s+/g, ' ').trim())
  }

  /**
   * Jump to a grid page via the numeric page-input (min 1, max 250) and wait
   * for the rows to refresh. Pagination is client-side and not reflected in the
   * URL, so callers assert on the row data instead.
   */
  async goToResultPage(n: number): Promise<void> {
    const input = this.main.locator('input[type="number"][max]').first()
    await input.fill(String(n))
    await input.press('Enter')
    await this.page.waitForTimeout(2500)
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

  // ---------------------------------------------------------------------------
  // Generic, cross-module filter exerciser (used by filters.spec.ts)
  // ---------------------------------------------------------------------------

  /** True if a fatal/error overlay is currently shown. */
  async pageErrored(): Promise<boolean> {
    return this.page
      .getByText(/something went wrong|unexpected error|failed to load|internal server error/i)
      .first()
      .isVisible()
      .catch(() => false)
  }

  /** Signature of the visible result set (first rows of the table, else cards). */
  async resultSignature(): Promise<string> {
    const rows = this.main.locator('table tbody tr:visible')
    if (await rows.count()) {
      const t = await rows.allInnerTexts().catch(() => [] as string[])
      return t.slice(0, 4).join('|').replace(/\s+/g, ' ').slice(0, 200)
    }
    const cards = this.main.locator('.q-card')
    const t = await cards.allInnerTexts().catch(() => [] as string[])
    return t.slice(0, 4).join('|').replace(/\s+/g, ' ').slice(0, 200)
  }

  /**
   * Discover the page's *filter* selects, skipping the page-size select (shows a
   * bare number) and the "Advanced Filters" disclosure (opens a panel, not an
   * option menu). Returns each select's current label for reporting.
   */
  async listFilters(): Promise<{ locator: Locator; label: string }[]> {
    const selects = this.main.locator('.q-select')
    const n = await selects.count()
    const out: { locator: Locator; label: string }[] = []
    for (let i = 0; i < n; i++) {
      const label = (await selects.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
      if (!label) continue
      if (/^\d+$/.test(label)) continue // page-size select
      if (/^advanced filters/i.test(label)) continue // disclosure panel, handled separately
      out.push({ locator: selects.nth(i), label: label.slice(0, 32) })
    }
    return out
  }

  /**
   * Exercise a single filter select: open it, pick an option different from the
   * current selection (skipping bulk options), close, and report whether the
   * result set / URL changed and whether the page errored.
   */
  async exerciseFilter(select: Locator, label: string): Promise<FilterResult> {
    const res: FilterResult = { label, found: true, opened: false, picked: null, changed: false, errored: false }
    const sigBefore = await this.resultSignature()
    const urlBefore = this.page.url()

    await select.scrollIntoViewIfNeeded().catch(() => {})
    await select.click({ timeout: 5000 }).catch(() => {})
    await this.page.waitForTimeout(900)
    const options = this.page.locator('.q-menu .q-item, .q-menu [role="option"]')
    const oc = await options.count()
    if (!oc) {
      await this.page.keyboard.press('Escape').catch(() => {})
      return res // opened nothing pickable (e.g. a disclosure/panel)
    }
    res.opened = true

    // Pick the first concrete option that isn't a bulk/select-all entry and that
    // differs from the currently-displayed value.
    for (let i = 0; i < oc; i++) {
      const optText = (await options.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
      if (!optText) continue
      if (/select all|show all|your brands|all brands|^all\b|^clear/i.test(optText)) continue
      if (optText.toLowerCase() === label.toLowerCase()) continue
      await options.nth(i).click().catch(() => {})
      res.picked = optText.slice(0, 32)
      break
    }
    await this.page.waitForTimeout(1800)
    await this.page.keyboard.press('Escape').catch(() => {})
    await this.page.waitForTimeout(800)

    res.errored = await this.pageErrored()
    const sigAfter = await this.resultSignature()
    res.changed = sigAfter !== sigBefore || this.page.url() !== urlBefore
    return res
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
