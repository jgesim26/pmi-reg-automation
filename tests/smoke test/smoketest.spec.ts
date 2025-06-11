import { log } from "console";
import { USER_CREDENTIALS, INVALID_USER_CREDENTIALS, login} from "../utils/constants";
import { TIMEOUT } from "dns";

const { test, expect } = require('@playwright/test');

test.describe('Verification for for login flow', () => {

  // Test case 1: Login Page Functionality
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
    
    // const WebsiteOverview = page.locator('q-item__label',{name: 'Trending Websites'})
    // await expect(WebsiteOverview).toBeVisible('true', {TIMEOUT : 60000});

  });


  // Test Case 2: Login Functionality - Negative Scenario
  test('The system should not display anything for invalid credentials', async ({ page }) => {
      console.log('Navigating to data.partnermatrix.com for invalid credentials test...');
      await page.goto('');
      await page.waitForLoadState('networkidle');
      console.log('PMI Page has successfully loaded.');
      
      console.log('Filling invalid username/email...');
      const usernameInput = page.getByPlaceholder('username')
      await usernameInput.fill(INVALID_USER_CREDENTIALS.invalusername);
      await expect(usernameInput).toHaveValue(INVALID_USER_CREDENTIALS.invalusername);

      console.log('Filling invalid password...');

      const passwordInput = page.getByPlaceholder('password')
      await passwordInput.fill(INVALID_USER_CREDENTIALS.invalpassword);
      await expect(passwordInput).toHaveValue(INVALID_USER_CREDENTIALS.invalpassword);

      console.log('Clicking login button...');
      const loginButton = page.getByRole('button', { name: 'Login' });

      await loginButton.click();
      console.log('Login button clicked.');
      const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/login') && response.request().method() === 'POST'),
      page.getByRole('button', { name: 'Login' }).click()
        
      ]);

      // Assert the status code
      console.log('Waiting for the server to respond......');
      expect(response.status()).toBe(401);

  });
});
    test.describe('Verification for for side navigation whether the page is present or removed', () => {  
      // //Test Case 3: Navigation 1 : Trending Websites
        test('Should redirect to Trending Websites Page', async ({ page }) => {
          
          console.log('Trying to load Trending Websites');
          console.log('Running test: should display essential trending website elements after login');

        await login(page);
        await page.getByText('Trending Websites').click();
        await expect(page.getByText('Trending Websites')).toBeVisible();
        
        });
        test('Should redirect to Opportunities Page', async ({ page }) => {
          await login(page);
        
        // await login(page);
        // await page.getByRole('Opportunities', {exact :true}).click();

        // const OpportunitiesLocator = page.getByText('Opportunities');
        // await expect(OpportunitiesLocator).toBeVisible();
        

        // Use a more specific locator for 'Opportunities'
        await page.locator('a.q-item:has(span:has-text("Opportunities"))').click();
        console.log('Trying to load Opportunities page');
        console.log('Running test: it should display Opportunities page');


        // You can then assert its visibility using the same specific locator
        const OpportunitiesLocator = page.locator('a.q-item:has(span:has-text("Opportunities"))').filter({ hasText: 'Opportunities' });
        await expect(OpportunitiesLocator).toBeVisible();
          
        });
          test('Should redirect to Your Websites Page', async ({ page }) => {
          
          console.log('Trying to load Your Websites page');
          console.log('Running test: it should display Your Websites page');

        await login(page);
        await page.getByText('Your Websites').click();

        const YourWebsitesLocator = page.getByText('Your Websites');
        await expect(YourWebsitesLocator).toBeVisible();
        
        });
        test('Should redirect to Position Changes Page', async ({ page }) => {
          
        console.log('Trying to load Position Changes page');
        console.log('Running test: it should display Position Changes page');

        await login(page);
        await page.getByText('Position Changes').click();
        await expect(page.getByText('Position Changes')).toBeVisible();
        
        });

      });
 //  Market Research > Website Search   
test.describe('', () => { 
  test('Should redirect to Settings Page', async ({ page }) => {

  });
});


// PPC
test.describe('Verify if side navs are present and visible', () => {  
  console.log('Running test: Trying to find PPC and its sub nav menu');
  
 

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



