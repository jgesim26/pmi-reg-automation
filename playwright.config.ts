import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Read environment variables from .env file.
 * Senior Practice: Ensures sensitive data isn't hardcoded.
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });
/**
 * PRE-RUN UTILITIES
 * Senior Practice: Automating directory maintenance.
 */
const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Ensure the auth directory exists
const authDir = path.dirname(STORAGE_STATE);
if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
}

// Senior Touch: Clean the screenshots folder before every fresh run
if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: 'html',
  reporter: [['./custom-reporter.ts']],

  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'https://stage.app.deepci.com',

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
        // This tells the browser to use the authenticated state
        storageState: STORAGE_STATE,
      },
      // Ensures the login project runs before the actual tests
      dependencies: ['setup'],
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
});