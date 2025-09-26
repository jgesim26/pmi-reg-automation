import {login} from "../utils/constants";

const { test, page, expect } = require('@playwright/test');



   test.describe('Check high level navigation ', () => {
  
      
        test.beforeEach(async ({ page }) => {
          await login(page);
          setTimeout(() => { 
            }, 2000);
        });

        test('Verify if website overview is the landing page after login. And should be able to see expected elements on the page', async ({ page }) => {
           
          const websiteOverviewTitle = page.locator('span.title:has-text("Website Overview")').filter({ hasText: 'Website Overview' });;
          await expect(websiteOverviewTitle).toBeVisible();

          await expect(page.getByText('Global Traffic Insights', {exact : true})).toBeVisible();
          console.log('Global Traffic Insights is visible via XPath');

          await expect(page.getByText('Track Top Traffic Pages', {exact : true})).toBeVisible();
          console.log('Track Top Traffic Pages is visible via XPath');

          await expect(page.getByText('Unlock Brand Rankings', {exact : true})).toBeVisible();
          console.log('Unlock Brand Rankings via XPath');

          await expect(page.getByText('Discover Related Websites', {exact : true})).toBeVisible();
          console.log('Discover Related Websites via XPath');

          await expect(page.getByText('Track Your Competition and Their Affiliates', {exact : true})).toBeVisible();
          console.log('Discover Related Websites via XPath');

            
        });

          test('Verify if Trending websites is visible and active', async ({ page }) => {
            console.log('Trying to load Trending Websites');
            console.log('Running test: should display essential trending website elements after login'); 
            await page.getByText('Trending Websites',{exact: true}).click();
            await expect(page.getByRole('main').getByText('Trending Websites', {exact : true})).toBeVisible();

          });
          test('Verify if Opportunities is visible and active', async ({ page }) => {

            await page.locator('a.q-item:has(span:has-text("Opportunities"))').click();
            console.log('Trying to load Opportunities page');
            console.log('Running test: it should display Opportunities page');
            const OpportunitiesPage = page.locator('a.q-item:has(span:has-text("Opportunities"))').filter({ hasText: 'Opportunities' });
            await expect(OpportunitiesPage).toBeVisible();
          });
          test('Verify if Your Websites is visible and active', async ({ page }) => {

            await page.locator('a.q-item:has(span:has-text("Your Websites"))').click();
            console.log('Trying to load Your Websites page');
            console.log('Running test: it should display Your Websites page');
            const OrganicYourWebsites = page.locator('a.q-item:has(span:has-text("Your Websites"))').filter({ hasText: 'Your Websites' });
            await expect(OrganicYourWebsites).toBeVisible(); 
            
          });
          test('Verify if Position Changes is visible and active', async ({ page }) => {
            await page.locator('a.q-item:has(span:has-text("Position Changes"))').click();
            console.log('Trying to load Position Changes page');
            console.log('Running test: it should display Position Changes page');
            const PositionChanges = page.locator('a.q-item:has(span:has-text("Position Changes"))').filter({ hasText: 'Position Changes' });
            await expect(PositionChanges).toBeVisible();     
          });

          test('Verify if Website Search is visible and active', async ({ page }) => {
            await page.locator('a.q-item:has(span:has-text("Website Search"))').click();
            console.log('Trying to load Website Search page');
            console.log('Running test: it should display Website Search page');
            const WebsiteSearch = page.locator('a.q-item:has(span:has-text("Website Search"))').filter({ hasText: 'Website Search' });
            await expect(WebsiteSearch).toBeVisible();   

          });
          test('Verify if Market Position is visible and active', async ({ page }) => {
            await page.locator('a.q-item:has(span:has-text("Market Position"))').click();
            console.log('Trying to load Market Position page');
            console.log('Running test: it should display Market Position page');
            const MarketPosition = page.locator('a.q-item:has(span:has-text("Market Position"))').filter({ hasText: 'Market Position' });
            await expect(MarketPosition).toBeVisible();    

          });
          test('Verify if PPC is visible and able to expand the dropdown', async ({ page }) => {
            await page.locator('//*[@id="q-app"]/div/div/div[1]/aside/div/div/div[1]/div/div/div[2]').click();
            
 

          });


          test('Verify if Website Top list page is visible working as expected', async ({ page }) => {
          
            console.log('Trying to load Website Top List page');
            console.log('Running test: it should display Website Top List page');

            await page.getByRole('button',{name: 'PPC'}).click();
            console.log('PPC is expanded');
          
            const WebsiteTopList = page.getByRole('Website Top List',{exact : true});
            WebsiteTopList.click();
              
          });  
          test('Verify if Keyword List page is visible working as expected', async ({ page }) => {
          
            await page.locator('a.q-item:has(span:has-text("Keyword List"))').click();
            console.log('Trying to load Keyword List page');
            console.log('Running test: it should display Keyword List page');
              // You can then assert its visibility using the same specific locator
            const KeywordList = page.locator('a.q-item:has(span:has-text("Keyword List"))').filter({ hasText: 'Keyword List' });
            await expect(KeywordList).toBeVisible();  
          });  

          test('Verify if Black Hat page is visible working as expected', async ({ page }) => {
          
            await page.locator('a.q-item:has(span:has-text("Black Hat"))').click();
            console.log('Trying to load Black Hat page');
            console.log('Running test: it should display Black Hat page');
              // You can then assert its visibility using the same specific locator
            const BlackHat = page.locator('a.q-item:has(span:has-text("Black Hat"))').filter({ hasText: 'Black Hat' });
            await expect(BlackHat).toBeVisible(); 
          });   
          test('Verify if Brand Bidding page is visible working as expected', async ({ page }) => {

            await page.locator('a.q-item:has(span:has-text("Brand Bidding"))').click();
            console.log('Trying to load Brand Bidding page');
            console.log('Running test: it should display Brand Bidding page');
              // You can then assert its visibility using the same specific locator
            const BrandBidding = page.locator('a.q-item:has(span:has-text("Brand Bidding"))').filter({ hasText: 'Brand Bidding' });
            await expect(BrandBidding).toBeVisible();  
          });
          test('Verify if Keyword Search page is visible working as expected', async ({ page }) => {

            await page.locator('a.q-item:has(span:has-text("Keyword Search"))').click();
            console.log('Trying to load Keyword Search page');
            console.log('Running test: it should display KeywordSearch page');
              // You can then assert its visibility using the same specific locator
            const KeywordSearch = page.locator('a.q-item:has(span:has-text("Keyword Search"))').filter({ hasText: 'Keyword Search' });
            await expect(KeywordSearch).toBeVisible();  
          });
          test('Verify if Telegram page is visible working as expected', async ({ page }) => {

            await page.locator('a.q-item:has(span:has-text("Telegram"))').click();
            console.log('Trying to load Telegram page');
            console.log('Running test: it should display Telegram page');
              // You can then assert its visibility using the same specific locator
            const TelegramPage = page.locator('a.q-item:has(span:has-text("Telegram"))').filter({ hasText: 'Telegram' });
            await expect(TelegramPage).toBeVisible();  
            setTimeout(() => { 
            }, 5000);

          });  

}); 






    