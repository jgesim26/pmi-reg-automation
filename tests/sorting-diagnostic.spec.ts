import { test, expect } from '@playwright/test'
import { ModulePage } from '../pages/ModulePage'
import { MODULES } from './modules.data'
import { recordRoute } from './url-annotation'

recordRoute()

/**
 * Per-column sorting crawl across every data-table module.
 *
 * For each table page it clicks every column header (ascending, then descending)
 * and classifies the column:
 *   ✅ working      — clicking reordered the rows or moved a sort URL param
 *   ❌ BROKEN       — the header advertises a sort affordance but nothing reacted
 *   ➖ not-sortable — no affordance and no reaction (expected for text/action cols)
 *
 * A module test FAILS when it has a ❌ BROKEN column, so the report surfaces the
 * exact sortable columns that are not working. Per-column lines are prefixed
 * with the module key so they stay attributable under parallel workers.
 */
const TABLE_MODULES = MODULES.filter((m) => m.kind === 'table' && m.expectData && !m.interactive)

test.describe('Sorting diagnostic — every data table', () => {
  for (const m of TABLE_MODULES) {
    test(`[${m.group}] ${m.name} sorting`, async ({ page }) => {
      test.setTimeout(150000)
      const mod = new ModulePage(page)

      console.log(`\n=== SORT ${m.group} / ${m.name}  (${m.route}) ===`)
      await mod.load(m.route)
      // Ensure rows are present before diagnosing (sorting needs data).
      await page.getByRole('table').first().locator('tbody tr').first().waitFor({ timeout: 15000 }).catch(() => {})

      const cols = await mod.diagnoseSorting()
      const working = cols.filter((c) => c.status === 'working')
      const broken = cols.filter((c) => c.status === 'BROKEN')
      const inert = cols.filter((c) => c.status === 'not-sortable')

      console.log(
        `   [${m.key}] Σ ${cols.length} columns: ${working.length} working, ${broken.length} BROKEN, ${inert.length} not-sortable`,
      )
      if (broken.length) console.log(`   [${m.key}] ❌ BROKEN sortable columns: [${broken.map((c) => c.label).join(', ')}]`)
      console.log(`   [${m.key}] ✅ working: [${working.map((c) => c.label).join(', ') || 'none'}]`)

      expect(
        broken.length,
        `${m.name}: sortable column(s) not working -> [${broken.map((c) => c.label).join(', ')}]`,
      ).toBe(0)
    })
  }
})
