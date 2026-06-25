import { test, expect } from '@playwright/test'
import { Filters } from '../pages/Filters'
import { MODULES } from './modules.data'
import { recordRoute } from './url-annotation'

recordRoute()

/**
 * Cross-module filter check: visits every data-table / grid module and exercises
 * each of its filter controls (Brands, Location, Verticals, Regulations, …),
 * reporting which filters actually re-query the data and which are broken.
 *
 * Per filter the outcome is one of:
 *   ✅ working      — picking an option changed the result set / URL, no error
 *   ⚠️ inconclusive — control responded but the visible result did not change
 *   ❌ broken       — the page showed an error overlay after using the filter
 *
 * A module test FAILS only on a ❌ broken filter; ⚠️ inconclusive is logged as a
 * warning (the data may legitimately be identical) but does not fail the run.
 *
 * The dedicated Website Search grid keeps its richer, URL-asserted coverage in
 * website-search-filters.spec.ts; this spec is the broad sweep over every page.
 */
const FILTERED_MODULES = MODULES.filter(
  (m) => !m.interactive && (m.kind === 'table' || m.kind === 'grid'),
)

test.describe('Filters — every data table / grid', () => {
  for (const m of FILTERED_MODULES) {
    test(`[${m.group}] ${m.name} filters`, async ({ page }) => {
      test.setTimeout(120000)
      const filters = new Filters(page)

      console.log(`\n=== ${m.group} / ${m.name}  (${m.route}) ===`)
      await page.goto(m.route, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.locator('table, .q-card, h1, h2').first().waitFor({ state: 'visible', timeout: 25000 }).catch(() => {})
      await page.waitForTimeout(2000)

      const discovered = await filters.listFilters()
      if (discovered.length === 0) {
        console.log('   ℹ️ no filter controls discovered on this page')
        // Modules flagged as having a filter must actually expose one.
        const expectedFilter = !!(m.hasLocationFilter || m.hasBrandFilter)
        expect.soft(!expectedFilter, `${m.name}: expected a Location/Brand filter but none was found`).toBeTruthy()
        return
      }

      let broken = 0
      let working = 0
      const lines: string[] = []
      for (const f of discovered) {
        // Reset to a clean state between filters so one filter's selection does
        // not mask the next (and so an order_by/search from a prior pick can't
        // poison the query).
        await page.goto(m.route, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
        await page.locator('table, .q-card').first().waitFor({ timeout: 15000 }).catch(() => {})
        await page.waitForTimeout(1500)

        // Re-resolve the control on the fresh page by its label.
        const fresh = (await filters.listFilters()).find((x) => x.label === f.label)
        if (!fresh) {
          console.log(`   • "${f.label}" — vanished after reload, skipping`)
          continue
        }
        const r = await filters.exerciseFilter(fresh.locator, fresh.label)
        const status = r.errored ? '❌ broken' : !r.opened ? '➖ not pickable' : r.changed ? '✅ working' : '⚠️ inconclusive'
        if (r.errored) broken++
        if (r.changed && !r.errored) working++
        const pick = r.picked ? ` → picked "${r.picked}"` : ''
        lines.push(`   • "${r.label}"${pick} — ${status}`)
        console.log(lines[lines.length - 1])
      }

      console.log(`   Σ ${working} working, ${broken} broken, of ${discovered.length} filter(s)`)
      expect(broken, `${m.name}: ${broken} filter(s) errored the page — see log`).toBe(0)
    })
  }
})
