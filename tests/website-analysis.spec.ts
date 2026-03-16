import { test } from '@playwright/test'
import { WebsiteOverviewPage } from '../pages/WebsiteOverviewPage'
import { TrendingWebsitesPage } from '../pages/TrendingWebsitesPage'
import { OpportunitiesPage } from '../pages/OpportunitiesPage'

test.describe('Website Overview Analysis', () => {
  let overviewPage: WebsiteOverviewPage

  test.beforeEach(async ({ page }) => {
    overviewPage = new WebsiteOverviewPage(page)

    await overviewPage.navigateTo('/organic-traffic/website-analysis/website-overview')
  })

  test('should validate brand search ', async () => {
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
  
test.describe('Opportunities Page', () => {
  let opportunitiesPage: OpportunitiesPage;

  test.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesPage(page);
    
    await opportunitiesPage.navigateToOpportunity();
  });
  test('should load opportunities data within 10s and verify table content', async () => {
    
    await opportunitiesPage.verifyPageLoadedWithin(10);
    await opportunitiesPage.verifyTableHasData();
    await opportunitiesPage.captureScreenshot('opportunities-page-verified');
  });
});
  
test.describe('Opportunities Page -> Location Gap', () => {
  let opportunitiesPageLocationGap: OpportunitiesPage;

  test.beforeEach(async ({ page }) => {
    opportunitiesPageLocationGap = new OpportunitiesPage(page);
    
    await opportunitiesPageLocationGap.navigateToLocationGap();
  });
  test('should load location gap data within 10s and verify table content', async () => {
    
    await opportunitiesPageLocationGap.verifyPageLoadedWithin(10);
    await opportunitiesPageLocationGap.verifyTableHasData();
    await opportunitiesPageLocationGap.captureScreenshot('location-gap-verified');
  });
});
 
test.describe('Opportunities Page -> Related Websites', () => {
  let opportunitiesPageLocationGap: OpportunitiesPage;

  test.beforeEach(async ({ page }) => {
    opportunitiesPageLocationGap = new OpportunitiesPage(page);
    
    await opportunitiesPageLocationGap.navigateToRelatedWebsites();
  });
  test('should load related websites data within 10s and verify table content if present', async () => {
    
    await opportunitiesPageLocationGap.verifyRelatedWebsitesLoadedWithin(10);
    await opportunitiesPageLocationGap.verifyTableHasData(undefined, false);
    await opportunitiesPageLocationGap.captureScreenshot('related-websites-verified');
  });
});