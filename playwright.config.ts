import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

 
dotenv.config({ path: path.resolve(__dirname, '.env') });
 
const STORAGE_STATE = process.env.PLAYWRIGHT_STORAGE_STATE
  ? path.resolve(process.env.PLAYWRIGHT_STORAGE_STATE)
  : path.join(__dirname, 'playwright/.auth/user.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

 
const authDir = path.dirname(STORAGE_STATE);
if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
}
 
if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

export default defineConfig({
  testDir: './tests',
  
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
 
  fullyParallel: true,
   
  forbidOnly: !!process.env.CI,
  
  /* Retry once locally: these E2E tests hit a shared live staging server, so
     occasional load-related stalls should self-heal rather than fail the run. */
  retries: process.env.CI ? 2 : 1,
  /* Cap parallelism: too many concurrent SPA loads overwhelm staging and cause
     blank/half-loaded pages. 2 workers keeps the live site stable. */
  workers: process.env.CI ? 1 : 2,
 
  /* Local: keep the custom reporter. CI: also emit an HTML report (uploaded as
     an artifact) + GitHub annotations + console list. */
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github'], ['./custom-reporter.ts']]
    : [['./custom-reporter.ts']],

  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://stage.app.deepci.com',

    /* Safety net: never let a single locator action hang indefinitely. */
    actionTimeout: 15000,
    navigationTimeout: 60000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Global setting to allow screenshots on failure in addition to your manual ones */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
       
        storageState: STORAGE_STATE,
      },
     
      dependencies: ['setup'],
    },
  ],

  
  outputDir: 'test-results/',
});

