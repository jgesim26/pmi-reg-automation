import { test, expect } from '@playwright/test';

test('Scan for duplicate High Value KWs in modal', async ({ page }) => {
    // 1. Navigate and Login
    // Note: Ensure the URL uses forward slashes
    await page.goto('https://stage.app.deepci.com/ppc/weekly/brand-top-list');
    
    // Using more robust selectors for login
    await page.fill('input[type="email"], input[name="username"]', 'jayson.gesim@everymatrix.com');
    await page.fill('input[type="password"]', 'ff');
    await page.click('button[type="submit"]');

    // Wait for the dashboard/page to load
    await page.waitForURL(url => url.href.includes('brand-top-list'));

    // 2. Identify and click the High Value KWs column
    // This looks for a cell that likely contains the "High Value KWs" trigger
    const highValueKWCell = page.locator('td').filter({ hasText: /^\d+$/ }).first(); 
    await highValueKWCell.click();

    // 3. Scan the Modal
    const modal = page.locator('[role="dialog"], .modal-body, .ant-modal-content');
    await expect(modal).toBeVisible();

    const keywordMap = new Map<string, number[]>(); // keyword -> [pageNumbers]
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        console.log(`Scanning page ${currentPage}...`);

        // Wait for table rows in the modal to load
        const rows = modal.locator('table tbody tr');
        await rows.first().waitFor({ state: 'visible' });
        
        const count = await rows.count();

        for (let i = 0; i < count; i++) {
            // Adjust index .nth(0) if the Keyword is in a different column
            const text = await rows.nth(i).locator('td').nth(0).innerText();
            const keyword = text.trim();

            if (keyword) {
                const existing = keywordMap.get(keyword) || [];
                keywordMap.set(keyword, [...existing, currentPage]);
            }
        }

        // 4. Pagination handling
        const nextButton = modal.locator('li[title="Next Page"], button:has-text("Next"), .ant-pagination-next:not(.ant-pagination-disabled)');
        
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
            await nextButton.click();
            currentPage++;
            // Wait for data to update (short delay or wait for specific network response)
            await page.waitForTimeout(1500); 
        } else {
            hasNextPage = false;
        }
    }

    // 5. Final Output
    console.log('\n--- Duplicate Report ---');
    let found = false;
    for (const [keyword, pages] of keywordMap.entries()) {
        if (pages.length > 1) {
            found = true;
            console.log(`Keyword: "${keyword}" | Found on pages: ${pages.join(', ')}`);
        }
    }

    if (!found) console.log('No duplicates detected.');
});