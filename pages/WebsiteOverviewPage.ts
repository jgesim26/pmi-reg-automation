import { expect, Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class WebsiteOverviewPage extends BasePage {
  readonly searchBox: Locator
  readonly pageHeading: Locator

  constructor(page: Page) {
    super(page)
    this.pageHeading = page.getByRole('heading', { name: 'Website Overview' })
    this.searchBox = page.getByPlaceholder(/search/i)
  }

  async verifyHeading() {
    const frame = this.page.locator('span.title:has-text("Website Overview")')

    await expect(frame).toBeVisible()
    await frame.evaluate((node) => {
      node.style.border = '2px solid #00ffcc'
      node.style.padding = '4px'  
    })
  }
  async searchAndSelectBrand(brand: string) {
    await this.searchBox.fill(brand)
    const result = this.page.locator(`text=${brand}`).first()
    await result.waitFor({ state: 'visible' })
  }

  async verifyAccordionHeadings() {
    const headings = [
      'Global Traffic Insights',
      'Track Top Traffic Pages',
      'Unlock Brand Rankings',
      'Discover Related Websites',
      'Track Your Competition and Their Affiliates '
    ]
    for (const text of headings) {
      const locator = this.page.getByText(text, { exact: true })
      await expect(this.page.getByText(text, { exact: true })).toBeVisible()
      await locator.evaluate((node) => {
        node.style.border = '2px solid #00ffcc'
        node.style.padding = '4px'  
      })
    }
  }
}
