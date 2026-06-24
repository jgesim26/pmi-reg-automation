import { test } from '@playwright/test'
import { ModulePage } from '../pages/ModulePage'
import { MODULES } from './modules.data'
import { recordRoute } from './url-annotation'

recordRoute()

/**
 * End-user system check: visits every module and verifies its core components
 * and functionality (navigation, content, data, filters, search, tabs,
 * pagination). Each module is an isolated test so one failure doesn't mask the
 * others; per-check results are logged with ✅/❌ and a full-page screenshot is
 * saved to ./screenshots/system-check-<key>.png.
 */
test.describe('System check — modules & components', () => {
  for (const m of MODULES) {
    test(`[${m.group}] ${m.name}`, async ({ page }) => {
      test.setTimeout(90000)
      const mod = new ModulePage(page)

      console.log(`\n=== ${m.group} / ${m.name}  (${m.route}) ===`)
      const secs = await mod.load(m.route)
      console.log(`   ⏱️ loaded in ${secs.toFixed(2)}s`)

      if (m.interactive) await mod.verifyReachable(m.urlContains)
      else await mod.verifyNavigated(m.urlContains)
      await mod.verifyAppShell()
      await mod.verifyNoFatalError()
      await mod.verifyControls()

      if (m.interactive) {
        // Interactive page: blank until the user acts — only load + controls are
        // verified above (no table/data/pagination to assert on first load).
        console.log('   ℹ️ interactive module — content renders after user input; skipping data/pagination checks')
      } else {
        await mod.verifyContentRendered(m.kind)
        await mod.verifyData(m.kind, m.expectData)
        if (m.kind === 'table' && m.columns?.length) await mod.verifyColumnHeaders(m.columns)
        if (m.kind === 'table' && m.expectData && m.sortable !== false) await mod.verifySorting()
        if (m.tabs > 0) await mod.verifyTabs(m.tabs)
        await mod.verifySearch()
        if (m.pager) await mod.verifyPagination(m.kind)
      }

      await mod.shot(m.key)
      mod.report(`${m.group} / ${m.name}`)
    })
  }
})
