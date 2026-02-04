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
  
  const mainContent = this.page.getByRole('main');
  await expect(mainContent.getByText('Website Overview', { exact: true })).toBeVisible();
}

  async searchAndSelectBrand(brand: string) {
    await this.searchBox.fill(brand)
    const result = this.page.locator(`text=${brand}`).first()
    await result.waitFor({ state: 'visible' })
    await result.click()
  }

  async verifyAccordionHeadings() {
    const headings = [
      'Global Traffic Insights',
      'Track Top Traffic Pages',
      'Unlock Brand Rankings',
      'Discover Related Websites',
    ]
    for (const text of headings) {
      await expect(this.page.getByText(text, { exact: true })).toBeVisible()
    }
  }
}
