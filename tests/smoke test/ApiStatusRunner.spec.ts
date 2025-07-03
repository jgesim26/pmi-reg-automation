import { test, expect, Page, Route } from '@playwright/test';

 
const WEBSITE_URL = 'https://api.data.partnermatrix.com/api/v1'; 

test('should crawl all API calls and assert non-200 statuses', async ({ page }) => {

  const non200ApiResponses: { url: string; status: number; }[] = [];

  /**
   * Route handler for intercepting network requests.
   * This function will be called for every network request made by the page.
   * @param route The Playwright Route object, used to control the request.
   * @param request The Playwright Request object, containing request details.
   */
  await page.route('**/*', async (route: Route) => {
    // Continue the request, allowing it to go to the network
    await route.continue();

    // Get the response for the current request
    const response = await route.request().response();

    // If there's no response (e.g., blocked request, network error), skip processing
    if (!response) {
      return;
    }

    const url = response.url();
    const status = response.status();
    const requestType = route.request().resourceType(); // e.g., 'xhr', 'fetch', 'document'

    // --- API Request Detection Logic ---
    // You can customize this logic based on how your APIs are structured.
    // Common ways to identify API calls:
    // 1. Check if the URL contains a specific API path (e.g., '/api/')
    // 2. Check the resource type (e.g., 'xhr' for XMLHttpRequest, 'fetch' for Fetch API calls)
    // 3. Check specific headers or methods if your APIs have unique characteristics

    // For this example, let's consider requests with resourceType 'xhr' or 'fetch'
    // and which are not the initial document load.
    const isApiCall = (requestType === 'xhr' || requestType === 'fetch');

    if (isApiCall) {
      console.log(`API Call Detected: ${route.request().method()} ${url} - Status: ${status}`);

      // Check if the status code is not 2xx (200-299 range)
      if (status < 200 || status >= 300) {
        non200ApiResponses.push({ url, status });
      }
    }
  });

  // Navigate to the website.
  // This will trigger all the network requests that the page makes.
  console.log(`Navigating to: ${WEBSITE_URL}`);
  await page.goto(WEBSITE_URL, { waitUntil: 'networkidle' }); // 'networkidle' waits until network activity ceases

  // --- Assertion Section ---
  // After all network activity is expected to be complete,
  // assert that no non-200 API responses were recorded.

  if (non200ApiResponses.length > 0) {
    console.error('\n--- Non-200 API Responses Found ---');
    non200ApiResponses.forEach(res => {
      console.error(`URL: ${res.url}, Status: ${res.status}`);
    });
    // Fail the test if any non-200 API responses were found
    expect(non200ApiResponses.length, 'Expected all API calls to return a 2xx status code.').toBe(0);
  } else {
    console.log('\nAll detected API calls returned a 200 status code.');
  }

  // You can add more assertions here based on your specific testing needs.
  // For instance, asserting that a specific element is visible on the page.
  // await expect(page.locator('body')).toBeVisible();
});
