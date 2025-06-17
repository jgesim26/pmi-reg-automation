
import { USER_CREDENTIALS, login} from "../utils/constants";

const { test, expect } = require('@playwright/test');

test.describe('Verification for login flow', () => {

  // Test case 1: Login Flow
  test('The system should allow a user to log in successfully on PartnerMatrix', async ({ page }) => {
    console.log('Navigating to data.partnermatrix.com...');
    await page.goto('');
    console.log('Attempting to fill username/email...');
    
    const usernameInput = page.getByPlaceholder('username')
    await usernameInput.fill(USER_CREDENTIALS.username);
    await expect(usernameInput).toHaveValue(USER_CREDENTIALS.username);
 
    console.log('Username/Email field filled.');
    console.log('Attempting to fill password...');
    
    const passwordInput = page.getByPlaceholder('Password')
    await passwordInput.fill(USER_CREDENTIALS.password);
    await expect(passwordInput).toHaveValue(USER_CREDENTIALS.password);
    
    console.log('Password field filled.');
    console.log('Attempting to click login button...');
   
    const loginButton = page.getByRole('button', { name: 'Login' });

    await loginButton.click();
    
    console.log('Login button clicked.');
    console.log('Verifying successful login...');   
    console.log('Login successful!');

  });


  // test.describe('Verification for side navigation whether the page is present or removed', () => {  
    // //Test Case 3: Navigation 1 : Trending Websites
      
      test('Should redirect to Trending Websites Page', async ({ page }) => {
        console.log('Trying to load Trending Websites');
        console.log('Running test: should display essential trending website elements after login');

        await login(page);
            // expand - enable this in the future
          // const OrganicTraffic = page.getByText('Organic Traffic')
          //   const isOrganicTrafficExpanded = await OrganicTraffic.getAttribute('aria-expanded');

          //   if (isOrganicTrafficExpanded === 'true') {
          //     console.log('Organic Traffic section is expanded, collapsing it to clear path.');
          //       await OrganicTraffic.click(); // Click to collapse if it's expanded
          //       // Optionally wait for it to visually collapse/aria-expanded to be 'false'
          //       await expect(OrganicTraffic).toHaveAttribute('aria-expanded', 'false');
          //     } else {
          //     console.log('OrganicTraffic section is already collapsed or not found expanded.');
          //      }
        await page.getByText('Trending Websites').click();
        await expect(page.getByText('Trending Websites', {exact : true})).toBeVisible();

  
      });
      test('Should redirect to Opportunities Page', async ({ page }) => {
        await login(page); 
          await page.locator('a.q-item:has(span:has-text("Opportunities"))').click();
            console.log('Trying to load Opportunities page');
            console.log('Running test: it should display Opportunities page');
            // You can then assert its visibility using the same specific locator
            const OpportunitiesLocator = page.locator('a.q-item:has(span:has-text("Opportunities"))').filter({ hasText: 'Opportunities' });
            await expect(OpportunitiesLocator).toBeVisible();
        
      });
      test('Should redirect to Position Changes Page', async ({ page }) => {
        
        console.log('Trying to load Position Changes page');
        console.log('Running test: it should display Position Changes page');

        await login(page);
        await page.getByText('PPC').click({TIMEOUT: 60000});
        await expect(page.getByText('PPC', { exact: true })).toBeVisible();
        await expect(page.getByText('PPC',{ exact: true })).toBeVisible();
        await page.getByText('Position Changes').click({TIMEOUT: 60000});
        await expect(page.getByText('Position Changes')).toBeVisible();
      
      });

});


// PPC
test.describe('Verify if side navs are present and visible', () => {  
 

    test('PPC dropdown should expand', async ({ page }) => {
      await login(page);
      await page.waitForLoadState('networkidle');
      await page.getByText('PPC').click({TIMEOUT: 60000});
      await expect(page.getByText('PPC')).toBeVisible();
      
    });
    test('Verify if Websiite Top List exists', async ({ page }) => {
      await login(page);
      await page.getByText('PPC').click({TIMEOUT: 60000});
      await expect(page.getByText('PPC')).toBeVisible();
      await page.getByText('Website Top List').click();
      await expect(page.getByText('Website Top List')).toBeVisible();
        
    });
    test('Verify if Keyword list List exists', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle');
    await page.getByText('PPC').click({TIMEOUT: 60000});
    await expect(page.getByText('PPC')).toBeVisible();
    await page.getByText('Keyword List').click({TIMEOUT: 60000});
    await expect(page.getByText('Keyword List')).toBeVisible();
        
    });
    test('Verify if Black Hat List exists', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle');
    await page.getByText('PPC').click({TIMEOUT: 60000});
    await expect(page.getByText('PPC')).toBeVisible();
    await page.getByText('Black Hat').click({TIMEOUT: 60000});
    await expect(page.getByText('Black Hat')).toBeVisible();
        
    });
    test('Verify if Brand Bidding exists', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle');
    await page.getByText('PPC').click({TIMEOUT: 60000});
    await expect(page.getByText('PPC')).toBeVisible();
    await page.getByText('Brand Bidding').click({TIMEOUT: 60000});
    await expect(page.getByText('Brand Bidding')).toBeVisible();
        
    });
        
        
          
});



