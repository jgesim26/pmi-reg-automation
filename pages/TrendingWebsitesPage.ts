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

    this.table = page.getByRole('table')
    this.tableRows = this.table.locator('tr')
  }

  async navigateToTrending() {
    await this.page.goto(
      '/organic-traffic/website-analysis/trending-websites?location_id=1&spectrum&search=&brand_id=my',
    )
  }

  async verifyPageLoadedWithin(seconds: number = 20) {
    await this.verifyUrlLoadedWithin(/\/trending-websites\?.*brand_id=my/, seconds, 'Trending Page')
    await expect(this.table).toBeVisible({ timeout: seconds * 1000 })
  }

  async verifyTableHasData() {
    const count = await this.tableRows.count()

    if (count > 0) {
      await this.highlight(this.table, '#28a745')
    }
    expect(count, 'Data table should not be empty').toBeGreaterThan(0)
  }

}
