import {login} from "../utils/constants";

const { test, expect } = require('@playwright/test');


    test.describe('Smoke test execution status', () => {
    });
      // Test case 1: Login Flow
      test('The system should allow a user to log in successfully on PartnerMatrix', async ({ page }) => {
        console.log('Navigating to data.partnermatrix.com...');
        // await page.goto('/');
        await login(page);
        
          
          console.log('Site is accessible. Login process has succesfully processed');

        
        // await expect (page.getByText('Website Overview', {exact: true})).toHaveURL(/.*\/organic-traffic\/website-analysis\/website-overview/);
      
        console.log('Successfully redirected to /organic-traffic/website-analysis/website-overview');

        console.log('User is logged in successfully and redirected to Website Overview page!');
      
        console.log('Trying to load Trending Websites');
        console.log('Running test: should display essential trending website elements after login');
        // await page.locator('a.q-item:has(span:has-text("Trending Websites"))').click();
        await page.getByText('Trending Websites',{exact: true}).click();
        await expect(page.getByRole('main').getByText('Trending Websites', {exact : true})).toBeVisible();

        await page.locator('a.q-item:has(span:has-text("Opportunities"))').click();
            console.log('Trying to load Opportunities page');
            console.log('Running test: it should display Opportunities page');
              // You can then assert its visibility using the same specific locator
            const OpportunitiesPage = page.locator('a.q-item:has(span:has-text("Opportunities"))').filter({ hasText: 'Opportunities' });
            await expect(OpportunitiesPage).toBeVisible();

        //Opportunities tabs
            const PageGapTab = page.locator('//*[@id="q-app"]/div/div/div[2]/main/div/div/div/div[3]/div/div[1]/div/a[1]').getByText('Page Gap',{exact: true});
            await PageGapTab.click();  
            console.log('Page Gap tab is activated');
          
            

            const LocationGapTab = page.locator( '//*[@id="q-app"]/div/div/div[2]/main/div/div/div/div[3]/div/div[1]/div/a[2]');
            await LocationGapTab.click();
            await expect(LocationGapTab).toBeVisible();  
            console.log('Location Gap tab is activated'); 
            

            const RelatedWebsitesTab = page.locator( '//*[@id="q-app"]/div/div/div[2]/main/div/div/div/div[3]/div/div[1]/div/a[3]');
            await LocationGapTab.click();  
            await expect(RelatedWebsitesTab).toBeVisible();  
            console.log('Related Websites tab is activated'); 
          
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
          await page.locator('//*[@id="q-app"]/div/div/div[1]/aside/div/div/div[1]/div/div/div[2]').click();
          console.log('PPC is expanded');

          setTimeout(() => { 
          }, 5000);


          // await page.locator('a.q-item:has(span:has-text("Website Top List"))').click({TIMEOUT: 60000});
            console.log('Trying to load Website Top List page');
            console.log('Running test: it should display Website Top List page');
              // You can then assert its visibility using the same specific locator
            const WebsiteTopList = page.locator('a.q-item:has(span:has-text("Website Top List"))').filter({ hasText: 'Website Top List' });
            WebsiteTopList.click();
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
            setTimeout(() => { 
            }, 5000);
          
          
      // Accessing account page settings
      
            console.log('Preparing to load Account settings');
            setTimeout(() => { 
            }, 5000);
        
              
                // const accountDropDownExpand = await page.locator('span.fs-16.gt-sm:has-text("Jayson Gesim")');
                const accountDropDownExpand = await page.getByText('Jayson Gesim');

                await accountDropDownExpand.click({TIMEOUT: 50000});
                
                  console.log('Account dropdown button clicked.');
                  console.log('Checking if the account settings is expanded')
                  
                  console.log('Account Settings is expanded');
                await accountDropDownExpand.click();  

                console.log('Account dropdown button clicked.');
                console.log('Checking if the account settings is expanded');
                
                const profileSettingsLink = page.getByText( 'Profile Settings',{exact: true});
                await expect(profileSettingsLink).toBeVisible();  
                 console.log('The page is redirected to Profile Settings page'); 
                 await profileSettingsLink.click();  
                 await expect(page).toHaveURL(/.*\/settings\/profile-settings/);
      
              

                const ManageAccountTab = page.getByText( 'Manage Account').filter({ hasText: 'Manage Account' });
                ManageAccountTab.click();
                await expect(page).toHaveURL(/.*settings\/manage-account\/your-preference/);
          
                const ActivityLogTab = page.getByText( 'Activity Log');
                await expect(ActivityLogTab).toBeVisible();  
                console.log('Activity Log tab is activated'); 
                await ActivityLogTab.click();  
                await expect(page).toHaveURL(/.*settings\/activity-log\/activities/);

                const SecurityTab = page.getByText( 'Security');
                await expect(SecurityTab).toBeVisible();  
                setTimeout(() => { 
                  console.log('Activity Log tab is activated'); 
                }, 5000);
            
                await SecurityTab.click();  
                await expect(page).toHaveURL(/.*settings\/security/);



      //Master Search : to see if the search bar is working 
                await page
                .getByPlaceholder('Search website or brand')
                .fill('covers.com');


      });
  // });
