import {login} from "../utils/constants";

const { test, expect } = require('@playwright/test');

test.describe('Verify if high level navigation are working as expected', () => {

  // Test case 1: Login Flow
  test('The system should allow a user to log in successfully on PartnerMatrix', async ({ page }) => {
    console.log('Navigating to data.partnermatrix.com...');
    await page.goto('/');
    await login(page);
  

    console.log('Login button clicked.');
    console.log('Verifying successful login and redirection...');  
     
    await expect(page).toHaveURL(/.*\/organic-traffic\/website-analysis\/website-overview/);
    console.log('Successfully redirected to /organic-traffic/website-analysis/website-overview');

    console.log('User is logged in successfully and redirected to Website Overview page!');

    console.log('Trying to load Trending Websites');
    console.log('Running test: should display essential trending website elements after login');
   await page.locator('a.q-item:has(span:has-text("Trending Websites"))').click();
    await expect(page.getByRole('main').getByText('Trending Websites', {exact : true})).toBeVisible();

    await page.locator('a.q-item:has(span:has-text("Opportunities"))').click();
        console.log('Trying to load Opportunities page');
        console.log('Running test: it should display Opportunities page');
          // You can then assert its visibility using the same specific locator
        const OpportunitiesPage = page.locator('a.q-item:has(span:has-text("Opportunities"))').filter({ hasText: 'Opportunities' });
        await expect(OpportunitiesPage).toBeVisible();

     await page.locator('a.q-item:has(span:has-text("Your Websites"))').click();
        console.log('Trying to load Your Websites page');
        console.log('Running test: it should display Your Websites page');
          // You can then assert its visibility using the same specific locator
        const OrganicYourWebsites = page.locator('a.q-item:has(span:has-text("Your Websites"))').filter({ hasText: 'Your Websites' });
        await expect(OrganicYourWebsites).toBeVisible();    

     await page.locator('a.q-item:has(span:has-text("Position Changes"))').click();
        console.log('Trying to load Position Changes page');
        console.log('Running test: it should display Position Changes page');
          // You can then assert its visibility using the same specific locator
        const PositionChanges = page.locator('a.q-item:has(span:has-text("Position Changes"))').filter({ hasText: 'Position Changes' });
        await expect(PositionChanges).toBeVisible();     
        
     await page.locator('a.q-item:has(span:has-text("Website Search"))').click();
        console.log('Trying to load Website Search page');
        console.log('Running test: it should display Website Search page');
          // You can then assert its visibility using the same specific locator
        const WebsiteSearch = page.locator('a.q-item:has(span:has-text("Website Search"))').filter({ hasText: 'Website Search' });
        await expect(WebsiteSearch).toBeVisible();   
        
      await page.locator('a.q-item:has(span:has-text("Market Position"))').click();
        console.log('Trying to load Market Position page');
        console.log('Running test: it should display Market Position page');
          // You can then assert its visibility using the same specific locator
        const MarketPosition = page.locator('a.q-item:has(span:has-text("Market Position"))').filter({ hasText: 'Market Position' });
        await expect(MarketPosition).toBeVisible();    

   //PPC
      await page.getByText('PPC').click({TIMEOUT: 60000});
      await expect(page.getByText('PPC')).toBeVisible(); 

      await page.locator('a.q-item:has(span:has-text("Website Top List"))').click();
        console.log('Trying to load Website Top List page');
        console.log('Running test: it should display Website Top List page');
          // You can then assert its visibility using the same specific locator
        const WebsiteTopList = page.locator('a.q-item:has(span:has-text("Website Top List"))').filter({ hasText: 'Website Top List' });
        await expect(WebsiteTopList).toBeVisible();  

        await page.locator('a.q-item:has(span:has-text("Keyword List"))').click();
        console.log('Trying to load Keyword List page');
        console.log('Running test: it should display Keyword List page');
          // You can then assert its visibility using the same specific locator
        const KeywordList = page.locator('a.q-item:has(span:has-text("Keyword List"))').filter({ hasText: 'Keyword List' });
        await expect(KeywordList).toBeVisible();  


        await page.locator('a.q-item:has(span:has-text("Black Hat"))').click();
        console.log('Trying to load Black Hat page');
        console.log('Running test: it should display Black Hat page');
          // You can then assert its visibility using the same specific locator
        const BlackHat = page.locator('a.q-item:has(span:has-text("Black Hat"))').filter({ hasText: 'Black Hat' });
        await expect(BlackHat).toBeVisible();  

        await page.locator('a.q-item:has(span:has-text("Brand Bidding"))').click();
        console.log('Trying to load Brand Bidding page');
        console.log('Running test: it should display Brand Bidding page');
          // You can then assert its visibility using the same specific locator
        const BrandBidding = page.locator('a.q-item:has(span:has-text("Brand Bidding"))').filter({ hasText: 'Brand Bidding' });
        await expect(BrandBidding).toBeVisible();  


         await page.locator('a.q-item:has(span:has-text("Keyword Search"))').click();
        console.log('Trying to load Keyword Search page');
        console.log('Running test: it should display KeywordSearch page');
          // You can then assert its visibility using the same specific locator
        const KeywordSearch = page.locator('a.q-item:has(span:has-text("Keyword Search"))').filter({ hasText: 'Keyword Search' });
        await expect(KeywordSearch).toBeVisible();  


        await page.locator('a.q-item:has(span:has-text("Telegram"))').click();
        console.log('Trying to load Telegram page');
        console.log('Running test: it should display Telegram page');
          // You can then assert its visibility using the same specific locator
        const TelegramPage = page.locator('a.q-item:has(span:has-text("Telegram"))').filter({ hasText: 'Telegram' });
        await expect(TelegramPage).toBeVisible();  
      
      
      
   // Accessing account page settings
   
        console.log('Preparing to load Account settings');
          
            const accountDropDownExpand = await page.locator('span.fs-16.gt-sm:has-text("Jayson Gesim")');
            // const accountDropDownExpand = await page.getByRole('button', {name: 'Jayson Gesim'});

            await accountDropDownExpand.click();
            
              console.log('Account dropdown button clicked.');
              console.log('Checking if the account settings is expanded')
              await expect(accountDropDownExpand).toHaveAttribute('aria-expanded', 'true');     
              console.log('Account Settings is expanded');

              await page.getByRole('link', { name: 'Profile Settings' }).click();
              await expect(page).toHaveURL(/.*\/settings\/profile-settings/);
              await expect(page.getByText('Profile Settings', { exact: true })).toBeVisible();   
        

  });
});
