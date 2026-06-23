import { test } from '@playwright/test'
import { WebsiteOverviewPage } from '../pages/WebsiteOverviewPage'
import { TrendingWebsitesPage } from '../pages/TrendingWebsitesPage'
import { OpportunitiesPage } from '../pages/OpportunitiesPage'
import { StagePage } from '../pages/StagePage'

const unknownBrand = '1exampleBET365'

/**
 * Deep-link detail pages that are NOT in the module registry (modules.data.ts),
 * so the generic system-check spec never visits them. The standard modules
 * (Your Websites, PPC lists, Telegram/Kick channels, etc.) are covered there;
 * here we only keep the routes system-check can't reach. These detail pages
 * don't always render a standard data table, so their table check is optional.
 */
const stageRoutes = [
  { route: '/organic/website/2B7E/3/2/top-pages', name: 'Flashscore Top Pages' },
  { route: '/organic/website/7JrZ/43/2/top-pages', name: 'Meczyki Top Pages' },
  { route: '/brand/x4yx/1/overview', name: 'Brand Overview' },
]

test.describe('PMI Stage positive flows', () => {
  test('should load Website Overview, verify the page, and search a brand', async ({ page }) => {
    const overviewPage = new WebsiteOverviewPage(page)
    await overviewPage.navigateTo('/organic-traffic/website-analysis/website-overview')

    await overviewPage.verifyHeading()
    await overviewPage.verifyAccordionHeadings()
    await overviewPage.searchAndSelectBrand('BET365')
    await overviewPage.captureScreenshot('stage-overview-brand-search')
  })

  test('should load Trending Websites and verify table content', async ({ page }) => {
    const trendingPage = new TrendingWebsitesPage(page)
    await trendingPage.navigateToTrending()

    await trendingPage.verifyPageLoadedWithin(20)
    await trendingPage.verifyTableHasData()
    await trendingPage.captureScreenshot('stage-trending-table')
  })

  test('should load Opportunities page and verify table content', async ({ page }) => {
    const opportunitiesPage = new OpportunitiesPage(page)
    await opportunitiesPage.navigateToOpportunity()

    await opportunitiesPage.verifyPageLoadedWithin(20)
    await opportunitiesPage.verifyTableHasData()
    await opportunitiesPage.captureScreenshot('stage-opportunities-page')
  })

  test('should load Opportunities Location Gap and verify table content', async ({ page }) => {
    const locationGapPage = new OpportunitiesPage(page)
    await locationGapPage.navigateToLocationGap()

    await locationGapPage.verifyPageLoadedWithin(20)
    await locationGapPage.verifyTableHasData()
    await locationGapPage.captureScreenshot('stage-opportunities-location-gap')
  })

  test('should load Opportunities Related Websites and verify table content if present', async ({ page }) => {
    const relatedWebsitesPage = new OpportunitiesPage(page)
    await relatedWebsitesPage.navigateToRelatedWebsites()

    await relatedWebsitesPage.verifyRelatedWebsitesLoadedWithin(20)
    await relatedWebsitesPage.verifyTableHasData(undefined, false)
    await relatedWebsitesPage.captureScreenshot('stage-opportunities-related-websites')
  })
})

test.describe('PMI Stage deep-link detail pages', () => {
  for (const routeInfo of stageRoutes) {
    test(`should load and validate ${routeInfo.name}`, async ({ page }) => {
      const stagePage = new StagePage(page)
      await stagePage.navigateTo(routeInfo.route)
      await stagePage.verifyPageLoaded(routeInfo.route)

      // Detail pages may not render a standard table — verify load, table optional.
      await stagePage.verifyTableHasData(false)

      await stagePage.captureScreenshot(`stage-${routeInfo.name.toLowerCase().replace(/\s+/g, '-')}`)
    })
  }
})

test.describe('PMI Stage negative flows', () => {
  test('should show no results for an unknown brand search', async ({ page }) => {
    const overviewPage = new WebsiteOverviewPage(page)
    await overviewPage.navigateTo('/organic-traffic/website-analysis/website-overview')

    await overviewPage.verifyNoSearchResults(unknownBrand)
    await overviewPage.captureScreenshot('stage-overview-no-results')
  })
})
