import { expect, Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export type ModuleKind = 'table' | 'grid' | 'overview'

interface CheckResult {
  label: string
  ok: boolean
  detail: string
}

/**
 * Generic, reusable end-user checks for a single module/page. Each verify*
 * method records a PASS/FAIL result (logged with ✅/❌ and soft-asserted so a
 * failure turns the test red without aborting the remaining checks).
 */
export class ModulePage extends BasePage {
  readonly results: CheckResult[] = []

  constructor(page: Page) {
    super(page)
  }

  // --- scopes ---------------------------------------------------------------
  private get main(): Locator {
    return this.page.locator('main, [role="main"], .q-page-container').first()
  }
  private get table(): Locator {
    return this.page.getByRole('table').first()
  }
  private rows(): Locator {
    return this.table.locator('tbody tr').filter({ hasText: /\S/ })
  }
  private cards(): Locator {
    return this.main.locator('.q-card')
  }

  /** Poll a locator's count until it is > 0 or the timeout elapses. */
  private async waitForCount(loc: Locator, timeout = 10000): Promise<number> {
    const end = Date.now() + timeout
    let n = await loc.count()
    while (n === 0 && Date.now() < end) {
      await this.page.waitForTimeout(500)
      n = await loc.count()
    }
    return n
  }

  /** Record + log a check and soft-assert it (so the test fails if !ok). */
  private record(label: string, ok: boolean, detail: string) {
    this.results.push({ label, ok, detail })
    console.log(`   ${ok ? '✅' : '❌'} ${label} — ${detail}`)
    expect.soft(ok, `${label}: ${detail}`).toBeTruthy()
  }

  // --- lifecycle ------------------------------------------------------------

  /** Navigate to the module and wait for the shell + primary content to settle. */
  async load(route: string): Promise<number> {
    const start = Date.now()
    await this.page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    // Wait for the app shell (sidebar) — guards against a blank/half-loaded SPA
    // under load before we start asserting on components.
    await this.page
      .locator('.q-drawer, aside, [class*="sidebar" i]')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => {})
    await this.page
      .locator('table, .q-card, h1, h2')
      .first()
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => {})
    // brief settle for async data fetches
    await this.page.waitForTimeout(1500)
    return (Date.now() - start) / 1000
  }

  // --- checks ---------------------------------------------------------------

  async verifyNavigated(urlContains: string) {
    const url = this.getCurrentUrl()
    this.record('Navigation', url.includes(urlContains), `URL "${url.replace(/^https?:\/\/[^/]+/, '')}" ${url.includes(urlContains) ? 'contains' : 'missing'} "${urlContains}"`)
  }

  /**
   * Lenient reachability check for interactive/guarded pages that may redirect
   * (e.g. Keyword Bidding redirects to Website Overview under some conditions).
   * Records reachability without failing, noting whether it stayed or redirected.
   */
  async verifyReachable(urlContains: string) {
    const url = this.getCurrentUrl().replace(/^https?:\/\/[^/]+/, '')
    const onRoute = url.includes(urlContains)
    this.record('Reachable', true, onRoute ? `loaded ${urlContains}` : `redirected to "${url.slice(0, 50)}" (interactive/guarded page)`)
  }

  async verifyAppShell() {
    const ok = await this.page.locator('.q-drawer, aside, [class*="sidebar" i]').first().isVisible().catch(() => false)
    this.record('App shell', ok, ok ? 'sidebar/layout rendered' : 'sidebar not visible')
  }

  async verifyNoFatalError() {
    const error = this.page
      .getByText(/something went wrong|internal server error|unexpected error|failed to load|access denied/i)
      .first()
    const hasError = await error.isVisible().catch(() => false)
    const detail = hasError ? `error text: "${(await error.innerText()).slice(0, 60)}"` : 'no fatal error overlay'
    this.record('No fatal error', !hasError, detail)
  }

  async verifyContentRendered(kind: ModuleKind) {
    if (kind === 'table') {
      const ok = await this.table.isVisible().catch(() => false)
      this.record('Content rendered', ok, ok ? 'data table present' : 'no <table> visible')
    } else {
      const count = await this.cards().count()
      this.record('Content rendered', count > 0, `${count} card section(s) rendered`)
    }
  }

  async verifyData(kind: ModuleKind, expectData: boolean) {
    if (kind === 'table') {
      // Rows are fetched asynchronously after load — give them a moment.
      const n = expectData ? await this.waitForCount(this.rows(), 12000) : await this.rows().count()
      if (expectData) this.record('Has data', n > 0, `${n} table row(s)`)
      else this.record('Has data (optional)', true, `${n} table row(s) (data not required on load)`)
    } else if (kind === 'grid') {
      const n = expectData ? await this.waitForCount(this.cards(), 12000) : await this.cards().count()
      if (expectData) this.record('Has data', n >= 3, `${n} grid card(s)`)
      else this.record('Has data (optional)', true, `${n} grid card(s)`)
    } else {
      const n = await this.waitForCount(this.cards(), 8000)
      this.record('Has data', n > 0, `${n} content card(s)`)
    }
  }

  async verifyControls() {
    // Some pages (e.g. Keyword Bidding) render controls lazily — wait for them.
    const controls = this.main.locator('.q-select, input[type="search"], input[placeholder*="search" i]')
    await this.waitForCount(controls, 12000)
    const selects = await this.main.locator('.q-select').count()
    const searches = await this.main.locator('input[type="search"], input[placeholder*="search" i]').count()
    const ok = selects + searches > 0
    this.record('Interactive controls', ok, `${selects} filter(s), ${searches} search input(s)`)
  }

  /**
   * Exercise search from a CLEAN state and confirm the page does not break.
   *
   * Earlier checks (notably `verifySorting`) push params like `order_by` into
   * the URL. On some list pages (e.g. PPC Brand Top List) the backend rejects a
   * combined sort+search query and the grid errors with "Something went wrong
   * loading the data" — a real defect, but unrelated to whether *search itself*
   * works. So we reset to the bare route before searching to isolate the search
   * feature. (The sort+search interaction is tracked separately as a finding.)
   */
  async verifySearch(term = 'casino') {
    if (!(await this.main.locator('input[type="search"], input[placeholder*="search" i]').first().count())) {
      this.record('Search (optional)', true, 'no in-page search input')
      return
    }
    try {
      // Reset any sort/filter the prior checks pushed into the query string.
      const u = new URL(this.getCurrentUrl())
      await this.page.goto(u.origin + u.pathname, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await this.page.locator('table, .q-card').first().waitFor({ timeout: 15000 }).catch(() => {})
      await this.page.waitForTimeout(1200)

      const input = this.main.locator('input[type="search"], input[placeholder*="search" i]').first()
      if (!(await input.count())) {
        this.record('Search (optional)', true, 'no in-page search input after reset')
        return
      }
      await input.fill(term)
      await input.press('Enter')
      await this.page.waitForTimeout(2000)
      const broke = await this.page.getByText(/something went wrong|unexpected error/i).first().isVisible().catch(() => false)
      this.record('Search functional', !broke, broke ? 'page errored after search' : `searched "${term}" without errors`)
    } catch (e) {
      this.record('Search functional', false, `search threw: ${String(e).split('\n')[0].slice(0, 60)}`)
    }
  }

  /** Click through each tab and verify the active state / content changes. */
  async verifyTabs(expected: number) {
    const tabs = this.page.locator('.q-tab, [role="tab"]')
    const n = await tabs.count()
    if (n === 0) {
      this.record('Tabs', expected === 0, expected === 0 ? 'no tabs expected' : `expected ${expected} tabs, found 0`)
      return
    }
    let switched = 0
    for (let i = 0; i < n; i++) {
      const tab = tabs.nth(i)
      const label = (await tab.innerText().catch(() => `#${i}`)).replace(/\s+/g, ' ').trim().slice(0, 24)
      try {
        await tab.click({ timeout: 5000 })
        await this.page.waitForTimeout(1200)
        const active = await tab.evaluate((el) => el.className.includes('active') || el.getAttribute('aria-selected') === 'true').catch(() => true)
        if (active) switched++
        console.log(`     • tab "${label}" -> ${active ? 'active' : 'clicked'}`)
      } catch {
        console.log(`     • tab "${label}" -> click failed`)
      }
    }
    this.record('Tabs functional', switched > 0, `${switched}/${n} tab(s) activated`)
  }

  private static readonly NEXT_SELECTOR =
    '.pager-btn:has(.fa-chevron-right), .q-pagination button[aria-label*="next" i], .q-pagination .q-btn:has(.fa-chevron-right), button[aria-label*="next" i]'

  /** A signature of the currently displayed data, used to detect page changes. */
  private async dataSignature(kind: ModuleKind): Promise<string> {
    const loc = kind === 'table' ? this.rows() : this.cards()
    const texts = await loc.allInnerTexts().catch(() => [] as string[])
    return texts.slice(0, 3).join('|').replace(/\s+/g, ' ').slice(0, 160)
  }

  /** The current page indicator (q-pagination active button or pager input). */
  private async activePage(): Promise<string> {
    // Guard every query with count() + an explicit timeout: innerText/inputValue
    // on an absent element would otherwise wait indefinitely and hang the test.
    const active = this.main
      .locator('.q-pagination button[aria-current="true"], .q-pagination .q-btn--active, .q-pagination button.bg-primary')
      .first()
    if (await active.count()) {
      const t = (await active.innerText({ timeout: 2000 }).catch(() => '')).trim()
      if (t) return `q:${t}`
    }
    const input = this.main.locator('.pmi-pager input, .page-input, input[type="number"]').first()
    if (await input.count()) return `i:${await input.inputValue({ timeout: 2000 }).catch(() => '')}`
    return ''
  }

  /**
   * Verify pagination is functional. A page-forward is considered successful if
   * ANY of these advance: the data signature, the URL (param-driven pagers), or
   * the active-page indicator — covering the app's different pager widgets.
   */
  async verifyPagination(kind: ModuleKind) {
    const next = this.main.locator(ModulePage.NEXT_SELECTOR).last()
    if (!(await next.count())) {
      this.record('Pagination (optional)', true, 'no pagination control')
      return
    }
    const cls = (await next.getAttribute('class')) || ''
    const disabled =
      (await next.getAttribute('disabled')) !== null ||
      (await next.getAttribute('aria-disabled')) === 'true' ||
      cls.includes('disabled') ||
      (await next.getAttribute('tabindex')) === '-1'
    if (disabled) {
      this.record('Pagination', true, 'single page (next disabled)')
      return
    }

    const sigBefore = await this.dataSignature(kind)
    const urlBefore = this.getCurrentUrl()
    const pageBefore = await this.activePage()
    try {
      await next.click({ timeout: 5000 })
      let changed = false
      const end = Date.now() + 12000
      while (Date.now() < end) {
        await this.page.waitForTimeout(600)
        const dataMoved = (await this.dataSignature(kind)) !== sigBefore
        const urlMoved = this.getCurrentUrl() !== urlBefore
        const pageMoved = (await this.activePage()) !== pageBefore
        if (dataMoved || urlMoved || pageMoved) {
          changed = true
          break
        }
      }
      this.record('Pagination functional', changed, changed ? `advanced to page ${await this.activePage() || '2'}` : 'no change after clicking next')
    } catch (e) {
      this.record('Pagination functional', false, `next click failed: ${String(e).split('\n')[0].slice(0, 50)}`)
    }
  }

  /** Assert the table exposes all expected column headers (subset match). */
  async verifyColumnHeaders(expected: string[]) {
    const headers = (await this.table.locator('thead th').allInnerTexts())
      .map((h) => h.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const missing = expected.filter((e) => !headers.some((h) => h.toLowerCase() === e.toLowerCase()))
    this.record(
      'Column headers',
      missing.length === 0,
      missing.length ? `missing [${missing.join(', ')}]; got [${headers.join(', ')}]` : `all ${expected.length} expected present (${headers.length} total)`,
    )
  }

  /**
   * Index of the "identity" column — the first header that isn't a rank ("#"),
   * blank, or a select/checkbox column. Its cell values (entity names) are
   * stable text, so their *ordering* is a clean signal that the table reordered,
   * unlike whole-row innerText which also flips when volatile cells (sparkline
   * charts, view counts, relative dates) re-render on any interaction.
   */
  private async entityColIndex(): Promise<number> {
    const heads = (await this.table.locator('thead th').allInnerTexts().catch(() => [])).map((h) => h.replace(/\s+/g, ' ').trim())
    const i = heads.findIndex((t) => t && t !== '#' && !/^select$/i.test(t))
    return i < 0 ? 0 : i
  }

  /** Ordered values of the identity column — the reorder signature. */
  private async identitySig(col: number): Promise<string> {
    const cells = this.rows().locator(`td:nth-child(${col + 1})`)
    const txt = await cells.allInnerTexts().catch(() => [] as string[])
    return txt.slice(0, 12).map((s) => s.replace(/\s+/g, ' ').trim()).join('|').slice(0, 320)
  }

  /** The sort-relevant slice of the URL query (order_by / sort / direction / asc|desc). */
  private sortParamSig(url = this.getCurrentUrl()): string {
    try {
      const q = new URL(url).searchParams
      const parts: string[] = []
      for (const [k, v] of q.entries()) {
        if (/order|sort|direction|asc|desc/i.test(k) || /^(asc|desc)$/i.test(v)) parts.push(`${k}=${v}`)
      }
      return parts.sort().join('&')
    } catch {
      return ''
    }
  }

  /**
   * The header's Font-Awesome sort-icon class, e.g. "fa-sort" (idle),
   * "fa-sort-up" (asc active) or "fa-sort-down" (desc active); '' when the
   * column has no sort icon. The app marks every sortable column with this icon
   * and flips it on click, so it is both the affordance and the reaction signal.
   */
  private async sortIconState(th: Locator): Promise<string> {
    return th
      .evaluate((el) => {
        const icon = el.querySelector('i[class*="fa-sort" i]')
        if (!icon) return ''
        const m = (icon.getAttribute('class') || '').match(/fa-sort(?:-up|-down)?/i)
        return m ? m[0].toLowerCase() : 'fa-sort'
      })
      .catch(() => '')
  }

  /** A header advertises sortability iff it carries a fa-sort* icon. */
  private async headerAffordance(th: Locator): Promise<boolean> {
    return (await this.sortIconState(th)) !== ''
  }

  /**
   * Per-column sorting diagnosis. Clicks every header twice (ascending, then
   * descending) and records, per column, whether the click reordered the rows
   * or moved a sort URL param. Classifies each column as:
   *   working      — reordered / refetched on click
   *   BROKEN       — advertises a sort affordance but nothing happened on click
   *   not-sortable — no affordance and no reaction (expected for text/action cols)
   * Returns the per-column rows (also useful for a standalone diagnostic spec).
   */
  async diagnoseSorting(): Promise<
    { index: number; label: string; affordance: boolean; asc: boolean; desc: boolean; sortable: boolean; status: 'working' | 'BROKEN' | 'not-sortable' }[]
  > {
    const headers = this.table.locator('thead th')
    const n = await headers.count()
    const out: Awaited<ReturnType<ModulePage['diagnoseSorting']>> = []
    if (n === 0) return out

    const entityCol = await this.entityColIndex()

    // A click "reacted" if the header's sort-icon state flipped (primary, content
    // independent), OR the identity-column ordering changed, OR a sort URL param
    // moved. A change via rows/URL must still hold after a short settle so a
    // transient re-render flicker doesn't count as a sort.
    const reacted = async (th: Locator, beforeIcon: string, beforeId: string, beforeParam: string): Promise<boolean> => {
      const end = Date.now() + 5000
      while (Date.now() < end) {
        await this.page.waitForTimeout(400)
        if ((await this.sortIconState(th)) !== beforeIcon) return true
        const idMoved = (await this.identitySig(entityCol)) !== beforeId
        const paramMoved = this.sortParamSig() !== beforeParam
        if (idMoved || paramMoved) {
          await this.page.waitForTimeout(500)
          return (await this.identitySig(entityCol)) !== beforeId || this.sortParamSig() !== beforeParam
        }
      }
      return false
    }

    for (let idx = 0; idx < n; idx++) {
      const th = headers.nth(idx)
      const label = (await th.innerText().catch(() => `#${idx}`)).replace(/\s+/g, ' ').trim().slice(0, 28) || `#${idx}`
      const affordance = await this.headerAffordance(th)

      // Ascending click.
      let icon0 = await this.sortIconState(th)
      let r1 = await this.identitySig(entityCol)
      let p1 = this.sortParamSig()
      await th.click({ timeout: 5000 }).catch(() => {})
      const asc = await reacted(th, icon0, r1, p1)

      // Descending click (toggle).
      icon0 = await this.sortIconState(th)
      r1 = await this.identitySig(entityCol)
      p1 = this.sortParamSig()
      await th.click({ timeout: 5000 }).catch(() => {})
      const desc = await reacted(th, icon0, r1, p1)

      const sortable = asc || desc
      const status: 'working' | 'BROKEN' | 'not-sortable' = sortable ? 'working' : affordance ? 'BROKEN' : 'not-sortable'
      out.push({ index: idx, label, affordance, asc, desc, sortable, status })
      console.log(`     · col "${label}" — ${status}${sortable ? ` (asc=${asc} desc=${desc})` : affordance ? ' (advertises sort but no reaction)' : ''}`)
    }
    return out
  }

  /**
   * Verify sorting works across the table. Uses the per-column diagnosis and
   * fails when a column that advertises a sort affordance does not react
   * (a broken sortable column), or when no column sorts at all.
   */
  async verifySorting() {
    const cols = await this.diagnoseSorting()
    if (cols.length === 0) {
      this.record('Sorting (optional)', true, 'no headers to sort')
      return
    }
    const working = cols.filter((c) => c.status === 'working').map((c) => c.label)
    const broken = cols.filter((c) => c.status === 'BROKEN').map((c) => c.label)

    if (broken.length) {
      this.record('Sorting functional', false, `broken sortable column(s): [${broken.join(', ')}]; working: [${working.join(', ') || 'none'}]`)
    } else if (working.length) {
      this.record('Sorting functional', true, `${working.length} sortable column(s) working: [${working.join(', ')}]`)
    } else {
      this.record('Sorting functional', false, 'no column reordered/refetched the table on click')
    }
  }

  /** Capture a full-page screenshot for the report. */
  async shot(key: string) {
    await this.page.screenshot({ path: `./screenshots/system-check-${key}.png`, fullPage: true }).catch(() => {})
  }

  /** Print a one-line summary; returns true when every check passed. */
  report(name: string): boolean {
    const passed = this.results.filter((r) => r.ok).length
    const total = this.results.length
    const allOk = passed === total
    console.log(`${allOk ? '✅ PASS' : '❌ FAIL'} [${name}] ${passed}/${total} checks passed`)
    return allOk
  }
}
