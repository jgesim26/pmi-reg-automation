import path from 'path'
import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class OpportunitiesPage extends BasePage {
  readonly table: Locator
  readonly tableRows: Locator

  constructor(page: Page) {
    super(page)
    this.table = page.getByRole('table')
    this.tableRows = this.table.locator('tr:visible')
  }

  async navigateToOpportunity() {
    await this.page.goto('/organic-traffic/website-analysis/opportunities/page-gap')
  }

  async navigateToLocationGap() {
    await this.page.goto('/organic-traffic/website-analysis/opportunities/location-gap')
  }
  

  async verifyPageLoadedWithin(
    seconds: number = 0,
    urlRegex: RegExp = /\/organic-traffic\/website-analysis\/opportunities\/(page-gap|location-gap|related-websites)/,
    waitForTable: boolean = true,
  ) {
    const start = Date.now()

    await expect(this.page).toHaveURL(urlRegex, { timeout: 10000 })

    await this.page.waitForLoadState('networkidle')

    if (waitForTable) {
      const tableCount = await this.table.count()
      if (tableCount > 0) {
        await expect(this.table).toBeVisible({ timeout: seconds * 1000 })
      }
    }

    const duration = (Date.now() - start) / 1000
    console.log(`⏱️ Opportunity page loaded in ${duration.toFixed(2)}s`)
    expect(duration).toBeLessThan(seconds)
  }

  async verifyLocationGapLoadedWithin(seconds: number = 0) {
    return this.verifyPageLoadedWithin(seconds, /\/organic-traffic\/website-analysis\/opportunities\/location-gap/)
  }

  async navigateToRelatedWebsites() {
    await this.page.goto('/organic-traffic/website-analysis/opportunities/related-websites')
  }

  async verifyRelatedWebsitesLoadedWithin(seconds: number = 0) {
    return this.verifyPageLoadedWithin(
      seconds,
      /\/organic-traffic\/website-analysis\/opportunities\/related-websites/,
      false,
    )
  }

  async verifyTableHasData(screenshotName?: string, failIfEmpty: boolean = true) {
    const count = await this.tableRows.count()

    if (count === 0) {
      console.log('⚠️ No table rows found (table may not exist on this page)')
      if (failIfEmpty) {
        expect(count, 'Data table should not be empty').toBeGreaterThan(0)
      }
      return
    }

    await this.table.evaluate((node) => {
      ;(node as HTMLElement).style.border = '3px solid #28a745'
    })

    const screenshotPath = path.join(
      process.cwd(),
      'screenshots',
      `${screenshotName ?? 'table-data'}-${Date.now()}.png`,
    )
    await this.page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 Saved table screenshot: ${screenshotPath}`)

    expect(count, 'Data table should not be empty').toBeGreaterThan(0)
  }
}
