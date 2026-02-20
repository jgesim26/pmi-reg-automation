import { test } from '@playwright/test'
import { WebsiteOverviewPage } from '../pages/WebsiteOverviewPage'
import { TrendingWebsitesPage } from '../pages/TrendingWebsitesPage'

test.describe('Website Overview Analysis', () => {
  let overviewPage: WebsiteOverviewPage

  test.beforeEach(async ({ page }) => {
    overviewPage = new WebsiteOverviewPage(page)

    await overviewPage.navigateTo('/organic-traffic/website-analysis/website-overview')
  })

  test('should validate brand search and accordion headers', async () => {
    await overviewPage.verifyHeading()
    await overviewPage.captureScreenshot('heading-check')
  })
  test('should validate accordion and headings visibility', async () => {
    await overviewPage.verifyAccordionHeadings()
    await overviewPage.captureScreenshot('accordions-verified')
  })
  test('should validate search functionality ', async () => {
    await overviewPage.searchAndSelectBrand('BET365')
    await overviewPage.captureScreenshot('brand-search-result')
  })
})
test.describe('Trending Websites Analysis', () => {
  let trendingPage: TrendingWebsitesPage;

  test.beforeEach(async ({ page }) => {
    trendingPage = new TrendingWebsitesPage(page);
    
    await trendingPage.navigateToTrending();
  });

  test('should load trending data within 10s and verify table content', async () => {
    
    await trendingPage.verifyPageLoadedWithin(10);
    await trendingPage.verifyTableHasData();
    await trendingPage.captureScreenshot('trending-websites-verified');
  });
});