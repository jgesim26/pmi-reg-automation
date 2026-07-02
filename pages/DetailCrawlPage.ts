import { expect, Locator, Page } from '@playwright/test'
import { BasePage, DEFAULT_TIMEOUT } from './BasePage'

interface CheckResult {
  label: string
  ok: boolean
  detail: string
}

/** First line of an error/exception, trimmed for one-line log/report detail. */
function firstLine(e: unknown): string {
  return String(e).split('\n')[0].slice(0, 80)
}

/** Filesystem-safe screenshot slug. */
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'entity'
}

/**
 * Data-driven crawler for deep-link *detail* pages (website / brand drill-downs)
 * that the module registry (modules.data.ts) never reaches. Instead of the old
 * hardcoded URL whitelist (stage-full.spec.ts), it discovers real entity links
 * from a source list table, drills into each entity, walks EVERY in-page tab,
 * and also opens row-level pop-ups/modals — verifying that every data table it
 * finds is present AND non-empty.
 *
 * STRICTNESS: unlike the older stage-full detail checks (which passed
 * `failIfEmpty=false`), this crawler does NOT tolerate empty tables or timeouts.
 * A missing/empty data table, a broken/blank tab, an error overlay, or a
 * navigation/render timeout is recorded as a FAILURE (turns the test red) via
 * expect.soft — while still letting the crawl finish so every defect surfaces in
 * one run rather than aborting on the first.
 *
 * Reporting mirrors ModulePage: each check is logged ✅/❌ and soft-asserted, and
 * `report()` prints the one-line pass/fail summary the custom reporter consumes.
 */
export class DetailCrawlPage extends BasePage {
  readonly results: CheckResult[] = []

  private static readonly TAB_SELECTOR = '.q-tab, [role="tab"]'
  private static readonly DIALOG_SELECTOR =
    '.q-dialog:visible, [role="dialog"]:visible, .modal:visible'
  private static readonly ERROR_TEXT =
    /something went wrong|internal server error|unexpected error|failed to load|access denied/i
  private static readonly EMPTY_STATE_TEXT = /no data|no results|nothing found|no .* found/i
  /** How long to wait for a table's rows to populate before calling it empty. */
  private static readonly ROW_TIMEOUT = 15000

  // --- reporting (mirrors ModulePage) --------------------------------------

  /** Record + log a check and soft-assert it (so the test fails if !ok). */
  private record(label: string, ok: boolean, detail: string) {
    this.results.push({ label, ok, detail })
    console.log(`   ${ok ? '✅' : '❌'} ${label} — ${detail}`)
    expect.soft(ok, `${label}: ${detail}`).toBeTruthy()
  }

  /** Current URL pathname (falls back to full URL) for concise log/report detail. */
  private path(): string {
    try {
      return new URL(this.getCurrentUrl()).pathname
    } catch {
      return this.getCurrentUrl()
    }
  }

  private get table(): Locator {
    return this.page.getByRole('table').first()
  }

  /** Non-empty data rows within a table scope. */
  private dataRows(scope: Locator): Locator {
    return scope.locator('tbody tr').filter({ hasText: /\S/ })
  }

  /**
   * Poll a row locator's count until it is > 0 or `timeout` elapses, returning
   * the final count. Detail-page tables render their <table> shell first and
   * fetch rows asynchronously, so counting immediately after the table is
   * visible produces false "empty" positives on a slow-but-valid load. Polling
   * lets a table that populates within the window pass, while one that stays
   * empty for the whole window is correctly reported empty (→ red).
   */
  private async waitForRows(rows: Locator, timeout = DetailCrawlPage.ROW_TIMEOUT): Promise<number> {
    const end = Date.now() + timeout
    let n = await rows.count()
    while (n === 0 && Date.now() < end) {
      await this.page.waitForTimeout(500)
      n = await rows.count()
    }
    return n
  }

  // --- source discovery -----------------------------------------------------

  /** Navigate to a source list and wait for its table (no recording). */
  private async openSource(route: string): Promise<boolean> {
    try {
      await this.page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60000 })
      // Guard against a blank/half-loaded SPA before we read the table.
      await this.page
        .locator('.q-drawer, aside, [class*="sidebar" i]')
        .first()
        .waitFor({ state: 'visible', timeout: 30000 })
        .catch(() => {})
      await this.table.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT })
      await this.page.waitForTimeout(1200) // brief settle for async row fetch
      return true
    } catch {
      return false
    }
  }

  /** Load a source list module and wait for its table to render. */
  async loadSource(route: string): Promise<void> {
    const ok = await this.openSource(route)
    this.record(
      'Source list loaded',
      ok,
      ok ? `${this.path()} table rendered` : `timeout/error loading ${route} (no table within ${DEFAULT_TIMEOUT / 1000}s)`,
    )
  }

  /**
   * Discover up to `limit` distinct detail-page hrefs from the source table that
   * match `pattern` (e.g. /organic/website/). Anchors are the app's real
   * navigation affordance, so this yields correct entity ids + params without
   * guessing the URL shape. Records a FAILURE if the source table exposes none.
   */
  async collectDetailLinks(
    pattern: RegExp,
    limit: number,
    sourceRoute: string,
  ): Promise<{ href: string; label: string }[]> {
    const anchors = this.page.locator('a[href]')
    const total = Math.min(await anchors.count(), 500)
    const seen = new Set<string>()
    const out: { href: string; label: string }[] = []

    for (let i = 0; i < total && out.length < limit; i++) {
      const a = anchors.nth(i)
      const href = (await a.getAttribute('href').catch(() => '')) || ''
      if (!href || !pattern.test(href) || seen.has(href)) continue
      seen.add(href)
      const label =
        (await a.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 40) || href
      out.push({ href, label })
    }

    // Fallback: some tables navigate via a row click handler (router.push) with
    // no <a href>. Probe the first rows by clicking and capturing the URL.
    let via = 'anchors'
    if (out.length === 0) {
      via = 'row-click'
      out.push(...(await this.collectViaRowClick(pattern, limit, sourceRoute)))
    }

    this.record(
      'Detail links discovered',
      out.length > 0,
      out.length
        ? `${out.length} entity link(s) via ${via}: [${out.map((o) => o.label).join(', ')}]`
        : `no links matching ${pattern} in source table (neither <a href> nor row-click navigation — selector needs review)`,
    )
    return out
  }

  /**
   * Discover detail links from a table whose rows navigate via a click handler
   * rather than an <a href>. Clicks the first identity cell of each row, captures
   * the resulting URL if it matches `pattern`, then returns to the source list.
   */
  private async collectViaRowClick(
    pattern: RegExp,
    limit: number,
    sourceRoute: string,
  ): Promise<{ href: string; label: string }[]> {
    const out: { href: string; label: string }[] = []
    const rowTotal = await this.dataRows(this.table).count().catch(() => 0)
    const max = Math.min(rowTotal, limit)

    for (let i = 0; i < max; i++) {
      const row = this.dataRows(this.table).nth(i)
      const cell = row.locator('td').filter({ hasText: /\S/ }).first()
      const label =
        (await cell.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 40) ||
        `row ${i + 1}`
      try {
        await cell.click({ timeout: 5000 })
        await this.page.waitForURL(pattern, { timeout: 8000 })
        out.push({ href: this.getCurrentUrl(), label })
      } catch {
        // Not a navigating row (opened a modal / no-op) — skip it.
      }
      // Return to the source list for the next probe (also dismisses any modal).
      await this.openSource(sourceRoute)
    }
    return out
  }

  // --- entity crawl ---------------------------------------------------------

  /** Navigate into one detail page (timeout → FAIL) and walk its tabs + modals. */
  async crawlEntity(href: string, label: string): Promise<void> {
    console.log(`\n   → ${label}  (${href})`)
    try {
      await this.page.goto(href, { waitUntil: 'networkidle', timeout: 60000 })
    } catch (e) {
      this.record(`Navigate [${label}]`, false, `timeout/error loading ${href}: ${firstLine(e)}`)
      return
    }
    this.record(`Navigate [${label}]`, true, `loaded ${this.path()}`)

    // Fatal-error overlay on landing → fail (but keep crawling the rest).
    const err = this.page.getByText(DetailCrawlPage.ERROR_TEXT).first()
    if (await err.isVisible().catch(() => false)) {
      this.record(
        `No fatal error [${label}]`,
        false,
        `error overlay: "${(await err.innerText().catch(() => '')).slice(0, 60)}" at ${this.path()}`,
      )
    }

    await this.walkTabs(label)
    await this.captureScreenshot(`detail-${slug(label)}`)
  }

  /** Click through every in-page tab, verifying each tab's content + pop-ups. */
  async walkTabs(entityLabel: string): Promise<void> {
    const count = await this.page.locator(DetailCrawlPage.TAB_SELECTOR).count()

    // No tabs → the detail page is a single panel; verify it directly.
    if (count === 0) {
      await this.assertTabContentStrict(entityLabel)
      await this.checkRowModals(entityLabel)
      return
    }

    console.log(`     tabs: ${count}`)
    for (let i = 0; i < count; i++) {
      // Re-locate each iteration: switching tabs can re-render the tab strip.
      const tab = this.page.locator(DetailCrawlPage.TAB_SELECTOR).nth(i)
      const label =
        (await tab.innerText().catch(() => `#${i}`)).replace(/\s+/g, ' ').trim().slice(0, 24) ||
        `#${i}`
      const ctx = `${entityLabel} › ${label}`
      try {
        await tab.click({ timeout: 6000 })
      } catch (e) {
        this.record(`Tab open [${ctx}]`, false, `tab click failed/timeout: ${firstLine(e)}`)
        continue
      }
      await this.page.waitForTimeout(800) // let the panel begin rendering
      await this.assertTabContentStrict(ctx)
      await this.checkRowModals(ctx)
    }
  }

  /**
   * Strict content verification for the currently active tab/panel.
   *
   *  • A data table that renders MUST have ≥1 row — an empty table FAILS.
   *  • A stuck/blank panel (nothing renders within the timeout) FAILS.
   *  • An error overlay FAILS.
   *  • A non-table panel passes only when real content (cards) or a deliberate
   *    empty-state renders — a bare blank FAILS.
   */
  private async assertTabContentStrict(context: string): Promise<void> {
    // Wait for SOMETHING meaningful: a table, cards, or an explicit empty/error
    // state. A pure timeout here means the tab is stuck/broken → fail.
    const anySignal = this.page
      .locator('table, main .q-card, [role="main"] .q-card, .q-banner, [class*="empty" i]')
      .first()
    try {
      await anySignal.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT })
    } catch {
      this.record(
        `Tab content [${context}]`,
        false,
        `nothing rendered within ${DEFAULT_TIMEOUT / 1000}s (timeout/blank) at ${this.path()}`,
      )
      return
    }

    // Hard error state is a failure.
    const errorText = this.page.getByText(DetailCrawlPage.ERROR_TEXT).first()
    if (await errorText.isVisible().catch(() => false)) {
      this.record(
        `Tab content [${context}]`,
        false,
        `error state: "${(await errorText.innerText().catch(() => '')).slice(0, 60)}" at ${this.path()}`,
      )
      return
    }

    // A data table is present → it MUST have rows (no empty table tolerated).
    if (await this.table.count()) {
      let rows = 0
      try {
        await this.table.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT })
        // Poll for rows: the table shell renders before its async row fetch, so
        // an eager count would flag a slow-but-valid load as empty.
        rows = await this.waitForRows(this.dataRows(this.table))
      } catch {
        rows = 0
      }
      if (rows > 0) await this.highlight(this.table, '#28a745')
      this.record(
        `Tab table [${context}]`,
        rows > 0,
        rows > 0
          ? `${rows} row(s) at ${this.path()}`
          : `table present but EMPTY at ${this.path()}`,
      )
      return
    }

    // No table: benign only if real non-table content or a deliberate empty
    // state rendered. (An empty-state MESSAGE is a designed non-table view, not a
    // broken data table — recorded visibly but not failed. A bare blank fails.)
    const cards = await this.page.locator('main .q-card, [role="main"] .q-card').count()
    const emptyState = await this.page
      .getByText(DetailCrawlPage.EMPTY_STATE_TEXT)
      .first()
      .isVisible()
      .catch(() => false)
    if (cards > 0) {
      this.record(`Tab content [${context}]`, true, `${cards} content card(s), no table at ${this.path()}`)
    } else if (emptyState) {
      this.record(`Tab content [${context}]`, true, `explicit empty-state, no table at ${this.path()}`)
    } else {
      this.record(`Tab content [${context}]`, false, `no table and no content rendered at ${this.path()}`)
    }
  }

  /**
   * Open a representative row-level pop-up/modal (if any) and verify the data
   * table inside it is non-empty. Not every tab has modals, so the absence of
   * one is not a failure — but a pop-up whose table is EMPTY is.
   */
  private async checkRowModals(context: string): Promise<void> {
    const rowCount = await this.dataRows(this.table).count().catch(() => 0)
    if (rowCount === 0) return // no table/rows → nothing to open

    // Common in-row triggers that open a details dialog.
    const triggers = this.table.locator(
      'tbody tr button, tbody tr [role="button"], tbody tr .q-btn, tbody tr i[class*="fa-"]',
    )
    const tCount = Math.min(await triggers.count(), 6)

    for (let i = 0; i < tCount; i++) {
      const trig = triggers.nth(i)
      try {
        await trig.click({ timeout: 4000 })
      } catch {
        continue
      }

      const dialog = this.page.locator(DetailCrawlPage.DIALOG_SELECTOR).first()
      let appeared = false
      try {
        await dialog.waitFor({ state: 'visible', timeout: 2500 })
        appeared = true
      } catch {
        // trigger wasn't a modal opener (sort icon, inline action) — try next.
      }
      if (!appeared) continue

      const dTable = dialog.locator('table').first()
      if (await dTable.count()) {
        const dRows = await this.waitForRows(this.dataRows(dTable), 6000).catch(() => 0)
        if (dRows > 0) await this.highlight(dTable, '#28a745')
        this.record(
          `Modal table [${context}]`,
          dRows > 0,
          dRows > 0 ? `${dRows} row(s) in pop-up` : 'pop-up table present but EMPTY',
        )
      } else {
        // Some pop-ups show detail cards/charts rather than a table.
        this.record(`Modal content [${context}]`, true, 'pop-up opened (no table inside)')
      }

      await this.closeDialog(dialog)
      // One representative modal per tab keeps the crawl bounded.
      return
    }

    console.log(`     • [${context}] no row-level pop-up detected`)
  }

  /** Best-effort close of an open dialog (close button, then Escape). */
  private async closeDialog(dialog: Locator): Promise<void> {
    const closeBtn = dialog
      .locator('button:has(i[class*="fa-times" i]), button[aria-label*="close" i], .q-btn:has(i[class*="close" i])')
      .first()
    if (await closeBtn.count()) {
      await closeBtn.click({ timeout: 3000 }).catch(() => {})
    }
    await this.page.keyboard.press('Escape').catch(() => {})
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }

  // --- summary --------------------------------------------------------------

  /** Print a one-line summary; returns true when every check passed. */
  report(name: string): boolean {
    const passed = this.results.filter((r) => r.ok).length
    const total = this.results.length
    const allOk = passed === total
    console.log(`${allOk ? '✅ PASS' : '❌ FAIL'} [${name}] ${passed}/${total} checks passed`)
    return allOk
  }
}
