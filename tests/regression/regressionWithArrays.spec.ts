// navigation.spec.js
const { test, expect } = require('@playwright/test');

// Define your navigation menu items in an array
const navMenuItems = [
    'Home',
    'About Us',
    'Services',
    'Contact',
    'Blog'
];

test.describe('Navigation Menu Tests', () => {

    test.beforeEach(async ({ page }) => {
        
        await page.goto('');
        
    });

    // Test to verify all navigation items are visible
    test('should display all navigation menu items', async ({ page }) => {
        for (const itemText of navMenuItems) {
            await expect(page.getByText(itemText, { exact: true })).toBeVisible();
        }
    });

    // Test to click each navigation item and assert content change
    test('should navigate correctly when each menu item is clicked', async ({ page }) => {
        const contentArea = page.locator('#page-content');

        for (const itemText of navMenuItems) {
            // Click the navigation item using getByText
            const navLink = page.getByText(itemText, { exact: true });
            await expect(navLink).toBeVisible(); // Ensure link is visible before clicking
            await navLink.click();

            // Perform assertions after click
            // For this example, we're checking the content of a div changes
            // In a real app, you might check URL, specific element visibility, API calls, etc.
            if (itemText === 'Home') {
                await expect(contentArea).toHaveText('Welcome to the Home Page!');
            } else if (itemText === 'About Us') {
                await expect(contentArea).toHaveText('Learn more about our company here.');
            } else if (itemText === 'Services') {
                await expect(contentArea).toHaveText('Discover the services we offer.');
            } else if (itemText === 'Contact') {
                await expect(contentArea).toHaveText('Get in touch with us.');
            } else if (itemText === 'Blog') {
                await expect(contentArea).toHaveText('Read our latest articles.');
            }

            // Optional: Add a small pause if needed to observe changes (not recommended for production tests)
            // await page.waitForTimeout(500);
        }
    });

    // Example of a more specific test for a single item
    test('should display correct content after clicking About Us', async ({ page }) => {
        await page.getByText('About Us', { exact: true }).click();
        await expect(page.locator('#page-content')).toHaveText('Learn more about our company here.');
    });

});
