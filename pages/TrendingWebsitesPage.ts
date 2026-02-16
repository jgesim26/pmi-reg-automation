import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class TrendingWebsitesPage extends BasePage {
  readonly searchBox: Locator
  readonly pageHeading: Locator

  constructor(page: Page) {
    super(page)
    this.pageHeading = page.getByRole('heading', { name: 'Website Overview' })
    this.searchBox = page.getByPlaceholder(/search/i)
  }

  // Added a specific navigate method for this page
  async navigateToTrending() {
    await this.page.goto(
      '/organic-traffic/website-analysis/trending-websites?location_id=1&spectrum&search=&brand_id=my',
    )
  }

  async verifyPageLoadedWithin(seconds: number = 5) {
    const start = Date.now()

    // Use a more flexible regex to handle the query parameters
    await expect(this.page).toHaveURL(/\/trending-websites\?.*brand_id=my/, { timeout: 10000 })

    await this.page.waitForLoadState('networkidle')
    await expect(this.table).toBeVisible({ timeout: seconds * 1000 })

    const duration = (Date.now() - start) / 1000
    console.log(`⏱️ Trending Page loaded in ${duration.toFixed(2)}s`)
    expect(duration).toBeLessThan(seconds)
  }

  async verifyTableHasData() {
    // Wait for the table to actually have content
    await this.tableRows.first().waitFor({ state: 'visible' })
    const count = await this.tableRows.count()

    if (count > 0) {
      await this.table.evaluate((node) => {
        ;(node as HTMLElement).style.border = '3px solid #28a745'
      })
    }
    expect(count, 'Data table should not be empty').toBeGreaterThan(0)
  }

  async captureScreenshot(name: string) {
    await this.page.screenshot({ path: `./screenshots/${name}.png`, fullPage: true })
  }
}
