import { test } from '@playwright/test'
import { WebsiteOverviewPage } from '../pages/WebsiteOverviewPage'
import { TrendingWebsitesPage } from '../pages/TrendingWebsitesPage'
import { OpportunitiesPage } from '../pages/OpportunitiesPage'
import { StagePage } from '../pages/StagePage'

const unknownBrand = 'UNKNOWN-BRAND-APPROX-123'

const stageRoutes = [
  { route: '/organic-traffic/affiliate-monitoring/your-websites', name: 'Your Websites' },
  { route: '/organic-traffic/affiliate-monitoring/position-changes/brand-demoted', name: 'Position Changes' },
  { route: '/organic-traffic/market-research/website-search', name: 'Website Search' },
  { route: '/organic-traffic/market-research/market-position/brand-market-share', name: 'Brand Market Share' },
  { route: '/ppc/weekly/website-top-list', name: 'PPC Website Top List' },
  { route: '/ppc/weekly/brand-top-list', name: 'PPC Brand Top List' },
  { route: '/ppc/weekly/keyword-list', name: 'PPC Keyword List' },
  { route: '/ppc/weekly/black-hat', name: 'PPC Black Hat' },
  { route: '/ppc/weekly/keyword-bidding', name: 'PPC Keyword Bidding' },
  { route: '/ppc/brand-bidding', name: 'PPC Brand Bidding' },
  { route: '/keyword-search', name: 'Keyword Search' },
  { route: '/telegram/channels', name: 'Telegram Channels' },
  { route: '/kick/channels', name: 'Kick Channels' },
  { route: '/organic/website/2B7E/3/2/top-pages', name: 'Flashscore Top Pages' },
  { route: '/organic/website/7JrZ/43/2/top-pages', name: 'Meczyki Top Pages' },
  { route: '/brand/x4yx/1/overview', name: 'Brand Overview' },
]

const searchRoutes = new Set(['/organic-traffic/market-research/website-search', '/keyword-search'])
const optionalTableRoutes = new Set([
  '/organic/website/2B7E/3/2/top-pages',
  '/organic/website/7JrZ/43/2/top-pages',
  '/brand/x4yx/1/overview',
])

test.describe('DeepCI Stage positive flows', () => {
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

test.describe('DeepCI Stage additional page coverage', () => {
  for (const routeInfo of stageRoutes) {
    test(`should load and validate ${routeInfo.name}`, async ({ page }) => {
      const stagePage = new StagePage(page)
      await stagePage.navigateTo(routeInfo.route)
      await stagePage.verifyPageLoaded(routeInfo.route)

      if (searchRoutes.has(routeInfo.route)) {
        await stagePage.submitSearch('deepci')
      } else {
        await stagePage.verifyTableHasData(!optionalTableRoutes.has(routeInfo.route))
      }

      await stagePage.captureScreenshot(`stage-${routeInfo.name.toLowerCase().replace(/\s+/g, '-')}`)
    })
  }
})

test.describe('DeepCI Stage negative flows', () => {
  test('should show no results for an unknown brand search', async ({ page }) => {
    const overviewPage = new WebsiteOverviewPage(page)
    await overviewPage.navigateTo('/organic-traffic/website-analysis/website-overview')

    await overviewPage.verifyNoSearchResults(unknownBrand)
    await overviewPage.captureScreenshot('stage-overview-no-results')
  })
})
