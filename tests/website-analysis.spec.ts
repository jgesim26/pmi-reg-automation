import { test } from '@playwright/test';
import { WebsiteOverviewPage } from '../pages/WebsiteOverviewPage';

test.describe('Website Overview Analysis', () => {
  let overviewPage: WebsiteOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new WebsiteOverviewPage(page);
   
    await overviewPage.navigateTo('/organic-traffic/website-analysis/website-overview');
  });

  test('should validate brand search and accordion headers', async () => {
    // 1. Check Heading
    await overviewPage.verifyHeading();
    await overviewPage.captureScreenshot('1-heading-check');

    // 2. Search Brand
    await overviewPage.searchAndSelectBrand('BET365');
    await overviewPage.captureScreenshot('2-brand-search-result');

    // 3. Check Accordions
    await overviewPage.verifyAccordionHeadings();
    await overviewPage.captureScreenshot('3-accordions-verified');
  });
});