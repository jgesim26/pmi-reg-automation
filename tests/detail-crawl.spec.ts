import { test } from '@playwright/test'
import { DetailCrawlPage } from '../pages/DetailCrawlPage'
import { DETAIL_SOURCES } from './detail-crawl.data'
import { recordRoute } from './url-annotation'

recordRoute()

/**
 * Detail-page crawl: data-driven from detail-crawl.data.ts. For each source list
 * it discovers real entity detail links, drills into each one, walks EVERY
 * in-page tab (Top Pages, Keywords, Brands, …), and opens row-level pop-ups /
 * modals — asserting every data table it finds is present AND non-empty.
 *
 * This replaces the old hardcoded stage-full whitelist (which only ever hit the
 * `top-pages` tab of two fixed websites and tolerated empty tables). Here empty
 * tables, broken/blank tabs, error overlays and timeouts all turn the test RED.
 *
 * One test per source so a failure in one doesn't mask the others; per-check
 * results are logged ✅/❌ and a full-page screenshot per entity is saved to
 * ./screenshots/.
 */
test.describe('Detail page crawl — deep-link drill-downs, tabs & modals', () => {
  for (const s of DETAIL_SOURCES) {
    test(`[${s.group}] ${s.name}`, async ({ page }) => {
      // Budget scales with how many entities we drill into (tabs + modals each).
      test.setTimeout(s.limit * 90000 + 60000)
      const crawler = new DetailCrawlPage(page)

      console.log(`\n=== Detail crawl: ${s.name}  (source: ${s.sourceRoute}) ===`)
      await crawler.loadSource(s.sourceRoute)

      const links = await crawler.collectDetailLinks(
        new RegExp(s.detailHrefPattern),
        s.limit,
        s.sourceRoute,
      )
      for (const link of links) {
        await crawler.crawlEntity(link.href, `${s.entity}: ${link.label}`)
      }

      crawler.report(s.name)
    })
  }
})
