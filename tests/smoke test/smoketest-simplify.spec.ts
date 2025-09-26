import { test, expect } from '@playwright/test';
import { login } from '../utils/constants'; // Assuming login function is in this path

test.describe('Smoke test execution status', () => {
  // Test case: Login Flow and navigation through various sections
  test('The system  allow a user to log in successfully and navigate various sections on PartnerMatrix', async ({ page }) => {
    console.log('Navigating to PartnerMatrix and logging in...');
    await login(page); // Assuming login handles navigation and login steps

    // Assert successful login by checking URL or a visible element
    await expect(page).toHaveURL(/.*\/organic-traffic\/website-analysis\/website-overview/);
    console.log('User is logged in successfully and redirected to Website Overview page!');

    // --- Organic Traffic Section ---
    console.log('Verifying Organic Traffic sections...');

    await page.getByText('Trending Websites', { exact: true }).click();
    await expect(page.getByRole('main').getByText('Trending Websites', { exact: true })).toBeVisible();
    console.log('Trending Websites page loaded.');

    await page.getByText('Opportunities', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Opportunities")')).toBeVisible(); // More robust locator
    console.log('Opportunities page loaded.');

    // Opportunities sub-tabs
    await page.getByText('Page Gap', { exact: true }).click();
    console.log('Page Gap tab activated.');

    await page.getByText('Location Gap', { exact: true }).click();
    await expect(page.getByText('Location Gap', { exact: true })).toBeVisible();
    console.log('Location Gap tab activated.');

    await page.getByText('Related Websites', { exact: true }).click();
    await expect(page.getByText('Related Websites', { exact: true })).toBeVisible();
    console.log('Related Websites tab activated.');

    await page.getByText('Your Websites', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Your Websites")')).toBeVisible();
    console.log('Your Websites page loaded.');

    await page.getByText('Position Changes', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Position Changes")')).toBeVisible();
    console.log('Position Changes page loaded.');

    await page.getByText('Website Search', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Website Search")')).toBeVisible();
    console.log('Website Search page loaded.');

    await page.getByText('Market Position', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Market Position")')).toBeVisible();
    console.log('Market Position page loaded.');

    // --- PPC Section ---
    console.log('Expanding PPC section...');
    // A more specific locator for the PPC expander would be ideal if available (e.g., role, test-id)
    await page.locator('div[role="button"]:has-text("PPC")').click(); // Assuming 'PPC' is a visible text within a clickable div
    console.log('PPC section expanded.');
    // No need for setTimeout here unless there's a specific visual transition to wait for

    console.log('Verifying PPC sections...');
    // await page.getByRole('button', { name: 'Website Top List' }).filter({ hasText: 'Website Tope list' });
    // await page.getByRole('listitem',{ name: 'Website Top List' }).click(); // Assert visibility of the link itself
    // await expect(page.locator('a.q-item:has-text("Website Top List")')).toBeVisible(); // Assert visibility of the link itself
    // console.log('Website Top List page loaded.');
    const WebsiteTopList = page.locator('xpath=//*[@id="f_d6f37530-d569-4d4e-b8ca-bde1dc8082bc"]/div[1]/a/div[1]').filter({hasText: 'Website Top List'});
    await WebsiteTopList.click();
    await expect(page.locator('a.q-item:has-text("Website Top List")')).toBeVisible();

    await page.pause();


    await page.getByText('Keyword List', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Keyword List")')).toBeVisible();
    console.log('Keyword List page loaded.');

    await page.getByText('Black Hat', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Black Hat")')).toBeVisible();
    console.log('Black Hat page loaded.');

    await page.getByText('Brand Bidding', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Brand Bidding")')).toBeVisible();
    console.log('Brand Bidding page loaded.');

    await page.getByText('Keyword Search', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Keyword Search")')).toBeVisible();
    console.log('Keyword Search page loaded.');

    await page.getByText('Telegram', { exact: true }).click();
    await expect(page.locator('a.q-item:has-text("Telegram")')).toBeVisible();
    console.log('Telegram page loaded.');

    // --- Account Settings ---
    console.log('Accessing account settings...');
    // Use a more specific locator for the account dropdown if possible (e.g., data-testid)
    await page.getByText('Jayson Gesim').click();
    console.log('Account dropdown clicked and expanded.');

    const profileSettingsLink = page.getByText('Profile Settings', { exact: true });
    await expect(profileSettingsLink).toBeVisible();
    await profileSettingsLink.click();
    await expect(page).toHaveURL(/.*\/settings\/profile-settings/);
    console.log('Redirected to Profile Settings page.');

    const manageAccountTab = page.getByText('Manage Account', { exact: true });
    await manageAccountTab.click();
    await expect(page).toHaveURL(/.*settings\/manage-account\/your-preference/);
    console.log('Manage Account tab activated.');

    const activityLogTab = page.getByText('Activity Log', { exact: true });
    await activityLogTab.click();
    await expect(page).toHaveURL(/.*settings\/activity-log\/activities/);
    console.log('Activity Log tab activated.');

    const securityTab = page.getByText('Security', { exact: true });
    await securityTab.click();
    await expect(page).toHaveURL(/.*settings\/security/);
    console.log('Security tab activated.');

    // --- Master Search ---
    console.log('Testing Master Search...');
    await page.getByPlaceholder('Search website or brand').fill('covers.com');
    console.log('Search query entered.');
    // Add an assertion here to verify search results if applicable
  });
});