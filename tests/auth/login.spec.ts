// import { test, expect } from '@playwright/test';
import { USER_CREDENTIALS, BASE_URL } from '../utils/constants';

const { test, expect } = require('@playwright/test');
// test.describe('Partnermatrix login functionality', () => {-
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to data.partnermatrix.com...');  
    await page.goto('/');
    console.log('PMI Page loaded successfully...');

    await page.waitForLoadState('networkidle');
    await expect(page.locator('.text-h4')).toBeVisible();
    
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
  
    await page.pause()
  });
// });