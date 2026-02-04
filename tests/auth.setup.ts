import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/'); // Uses baseURL from config
  await loginPage.login(process.env.USER_EMAIL!, process.env.USER_PASS!);
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});