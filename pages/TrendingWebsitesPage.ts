import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class TrendingWebsitesPage extends BasePage {
  readonly searchBox: Locator
  readonly pageHeading: Locator
  readonly table: Locator
  readonly tableRows: Locator

  constructor(page: Page) {
    super(page)
    this.pageHeading = page.getByRole('heading', { name: 'Website Overview' })
    this.searchBox = page.getByPlaceholder(/search/i)

    this.table = page.locator('table')
    this.tableRows = this.table.locator('tr')
  }

  async navigateToTrending() {
    await this.page.goto(
      '/organic-traffic/website-analysis/trending-websites?location_id=1&spectrum&search=&brand_id=my',
    )
  }

  async verifyPageLoadedWithin(seconds: number = 10) {
    const start = Date.now()

    await expect(this.page).toHaveURL(/\/trending-websites\?.*brand_id=my/, { timeout: 10000 })

    await this.page.waitForLoadState('networkidle')
    await expect(this.table).toBeVisible({ timeout: seconds * 1000 })

    const duration = (Date.now() - start) / 1000
    console.log(`⏱️ Trending Page loaded in ${duration.toFixed(2)}s`)
    expect(duration).toBeLessThan(seconds)
  }

  async verifyTableHasData() {
    await this.table.locator('tr:visible').first()
    const count = await this.tableRows.count()

    if (count > 0) {
      await this.table.evaluate((node) => {
        ;(node as HTMLElement).style.border = '3px solid #28a745'
      })
    }
    expect(count, 'Data table should not be empty').toBeGreaterThan(0)
  }

  async captureScreenshot(name: string) {
    let date = Date.now().toString(2);
    await this.page.screenshot({ path: `./screenshots/${date}-${name}.png`, fullPage: true })
  }
}
