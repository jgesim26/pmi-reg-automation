
import { TIMEOUT } from "dns";
import { USER_CREDENTIALS, INVALID_USER_CREDENTIALS, login} from "../utils/constants";

const { test, expect } = require('@playwright/test');

test.describe('PartnerMatrix Login Flow', () => {

  // Test case 1: Login Page Functionality
  test('should allow a user to log in successfully on PartnerMatrix', async ({ page }) => {
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
    
    const WebsiteOverview = page.locator('q-item__label',{name: 'Trending Websites'})
    await expect(WebsiteOverview).toBeVisible('true', {TIMEOUT : 60000});

  });


  // Test Case 2: Login Functionality - Negative Scenario
  // test('should not display anything for invalid credentials', async ({ page }) => {
  //     console.log('Navigating to data.partnermatrix.com for invalid credentials test...');
  //     await page.goto('');
  //     await page.waitForLoadState('networkidle');
  //     console.log('PMI Page has successfully loaded.');
      
  //     console.log('Filling invalid username/email...');
  //     const usernameInput = page.getByPlaceholder('username')
  //     await usernameInput.fill(INVALID_USER_CREDENTIALS.invalusername);
  //     await expect(usernameInput).toHaveValue(INVALID_USER_CREDENTIALS.invalusername);

  //     console.log('Filling invalid password...');

  //     const passwordInput = page.getByPlaceholder('password')
  //     await passwordInput.fill(INVALID_USER_CREDENTIALS.invalpassword);
  //     await expect(passwordInput).toHaveValue(INVALID_USER_CREDENTIALS.invalpassword);

  //     console.log('Clicking login button...');
  //     const loginButton = page.getByRole('button', { name: 'Login' });

  //     await loginButton.click();
  //     console.log('Login button clicked.');
  //     const [response] = await Promise.all([
  //     page.waitForResponse(response => response.url().includes('/login') && response.request().method() === 'POST'),
  //     page.getByRole('button', { name: 'Login' }).click()
        
  //     ]);

  //     // Assert the status code
  //     console.log('Waiting for the server to respond......');
  //     expect(response.status()).toBe(401);

  // });
  // //Test Case 3: Navigation 1 : Trending Websites
  test('Should redirect to Trending Websites Page', async ({ page }) => {
    
    console.log('Trying to load Trending Websites');
    console.log('Running test: should display essential dashboard elements after login');

  await login(page);
  await page.getByRole('listitem', { name: 'Trending Websites New' }).click();
  await expect(page).toHaveURL('https://data.partnermatrix.com/organic-traffic/website-analysis/trending-websites'); // Check URL changed
  // await expect(page.getByRole('main').getByText('Trending Websites')).toBeVisible({TIMEOUT: 60000});

   
     
  
    await page.pause();
  });


  });

