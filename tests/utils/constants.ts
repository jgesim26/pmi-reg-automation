export const USER_CREDENTIALS = {
  username: 'jayson.gesim@everymatrix.com',
  password: '123',
};
export const INVALID_USER_CREDENTIALS = {
  invalusername: 'jayson.gesim@everymatrixX.com',
  invalpassword: '1233',
};

// You can add more constants here if needed
export const BASE_URL = 'https://data.partnermatrix.com';
export const TIMEOUT = 20000; // Example timeout in milliseconds

// Helper function for login (reusable across tests)
async function login(page: Page, username, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="username"]', username); // Adjust selectors as needed
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`); // Wait for navigation to dashboard
  await expect(page.locator('h1')).toContainText('Welcome to Dashboard'); // Basic verification
}