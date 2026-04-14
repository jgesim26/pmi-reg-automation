import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { chromium } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://stage.app.deepci.com';
const storageStatePath = process.env.PLAYWRIGHT_STORAGE_STATE
  ? path.resolve(process.env.PLAYWRIGHT_STORAGE_STATE)
  : path.join(__dirname, 'playwright', '.auth', 'user.json');
const email = process.env.USER_EMAIL;
const pass = process.env.USER_PASS;

function askToContinue(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Press ENTER after manual login to save storage state...', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  console.log(`Using baseURL: ${baseURL}`);
  console.log(`Saving storage state to: ${storageStatePath}`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseURL);

  if (email && pass) {
    console.log('Attempting to log in automatically with credentials from .env...');

    const emailLocator = page.locator(
      'input[type="email"], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[id*="user" i], input[placeholder*="Username" i], input[placeholder*="Email" i]'
    ).first();
    const passwordLocator = page.locator(
      'input[type="password"], input[name*="pass" i], input[id*="pass" i], input[placeholder*="Password" i]'
    ).first();

    await emailLocator.waitFor({ state: 'visible', timeout: 15000 });
    await passwordLocator.waitFor({ state: 'visible', timeout: 15000 });

    await emailLocator.fill(email);
    await passwordLocator.fill(pass);
    await page.getByRole('button', { name: /login/i }).click();

    const invalidMessage = page.getByText(/invalid username or password/i);
    const successHeading = page.getByRole('heading', { name: /website overview/i });

    const result = await Promise.race([
      invalidMessage.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error'),
      successHeading.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'success'),
      page.waitForURL(/\/organic-traffic\/website-analysis\/website-overview/, { timeout: 20000 }).then(() => 'url'),
    ]);

    if (result === 'error') {
      throw new Error('Automatic login failed: invalid username or password. Use manual login or correct .env credentials.');
    }

    console.log('Login successful. Saving storage state...');
  } else {
    console.log('No credentials found in .env. Please complete a manual login in the opened browser.');
    await askToContinue();
  }

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  await context.storageState({ path: storageStatePath });

  console.log(`Storage state saved to ${storageStatePath}`);
  await browser.close();
}

main().catch((error) => {
  console.error('Error generating auth state:', error);
  process.exit(1);
});