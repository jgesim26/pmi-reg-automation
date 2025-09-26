import { chromium, Page } from '@playwright/test';

async function findMissingStrings(url: string, stringsToCheck: string[]): Promise<string[]> {
    const browser = await chromium.launch();
    const page: Page = await browser.newPage();
    const missingStrings: string[] = [];

    try {
        await page.goto(url);

        for (const str of stringsToCheck) {
            // Check if the string exists on the page
            // We use page.locator and then count to check for existence
            const count = await page.locator(`text=${str}`).count();
            if (count === 0) {
                missingStrings.push(str);
            }
        }
    } catch (error) {
        console.error(`Error navigating to ${url} or checking strings:`, error);
        // You might want to push all strings to missingStrings if navigation fails completely,
        // or handle the error in a way that makes sense for your application.
        // For simplicity here, we'll just log the error and return whatever we've found so far.
    } finally {
        await browser.close();
    }

    return missingStrings;
}

// --- Example Usage ---
(async () => {
    const targetUrl = 'https://snapshots.deepci.com/screenshots_olap/organic/230_listing/mobile/81656.html'; // Replace with the URL you want to test
    const stringsToVerify = [
        'BETMGM','BETMGM','LEOVEGAS','VBET','COMEON','UNIBET','TONYBET','BETNATION','BINGOAL'
    ];

    console.log(`Visiting: ${targetUrl}`);
    console.log('Checking for the following strings:', stringsToVerify);

    const notFoundStrings = await findMissingStrings(targetUrl, stringsToVerify);

    if (notFoundStrings.length > 0) {
        console.log('\n--- Strings NOT found on the page ---');
        notFoundStrings.forEach(str => console.log(`- "${str}"`));
    } else {
        console.log('\nAll specified strings were found on the page.');
    }
})();