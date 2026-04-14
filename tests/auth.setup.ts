import fs from 'fs';
import path from 'path';
import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const storageStatePath = process.env.PLAYWRIGHT_STORAGE_STATE
  ? path.resolve(process.env.PLAYWRIGHT_STORAGE_STATE)
  : path.join(__dirname, '..', 'playwright', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);

  if (fs.existsSync(storageStatePath)) {
    console.log('Reusing existing Playwright storage state:', storageStatePath);
    return;
  }

  const email =
    process.env.USER_EMAIL ||
    process.env.PLAYWRIGHT_USER_EMAIL ||
    process.env.EMAIL ||
    process.env.LOGIN_EMAIL;
  const pass =
    process.env.USER_PASS ||
    process.env.PLAYWRIGHT_USER_PASS ||
    process.env.PASSWORD ||
    process.env.LOGIN_PASSWORD;

  if (!email || !pass) {
    if (process.env.PLAYWRIGHT_STORAGE_STATE) {
      throw new Error(
        `PLAYWRIGHT_STORAGE_STATE was set to '${process.env.PLAYWRIGHT_STORAGE_STATE}', but the file was not found. Provide a valid storage state file or valid USER_EMAIL / USER_PASS.`
      );
    }
    throw new Error(
      'Missing credentials. Update .env from .env.example with valid USER_EMAIL and USER_PASS, or set PLAYWRIGHT_STORAGE_STATE to a valid storage state file.'
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPass = pass.trim().toLowerCase();
  const placeholderEmailValues = ['your.email@example.com'];
  const placeholderPassValues = ['yourpassword'];

  if (
    placeholderEmailValues.includes(normalizedEmail) ||
    placeholderPassValues.includes(normalizedPass)
  ) {
    throw new Error(
      'Placeholder credentials detected. Update .env from .env.example with valid USER_EMAIL and USER_PASS, or set PLAYWRIGHT_STORAGE_STATE to a valid storage state file.'
    );
  }

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  await loginPage.login(email, pass);
  await page.context().storageState({ path: storageStatePath });
});