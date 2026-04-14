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
    const headingLocator = this.page.getByRole('heading', { name: /website overview/i }).first()
    const fallbackLocator = this.page.getByText(/global traffic insights/i).first()
    const searchLocator = this.page.getByPlaceholder(/search/i).first()

    await expect(searchLocator).toBeVisible({ timeout: 15000 })

    if (await headingLocator.count()) {
      await expect(headingLocator).toBeVisible({ timeout: 15000 })
      await headingLocator.evaluate((node) => {
        ;(node as HTMLElement).style.border = '2px solid #00ffcc'
        ;(node as HTMLElement).style.padding = '4px'
      })
      return
    }

    await expect(fallbackLocator).toBeVisible({ timeout: 15000 })
    await fallbackLocator.evaluate((node) => {
      ;(node as HTMLElement).style.border = '2px solid #00ffcc'
      ;(node as HTMLElement).style.padding = '4px'
    })
  }

  async searchAndSelectBrand(brand: string) {
    await this.searchBox.fill(brand)
    await this.page.keyboard.press('Enter')
    const result = this.page.locator(`text=${brand}`).first()
    await result.waitFor({ state: 'visible', timeout: 15000 })
  }

  async verifyNoSearchResults(brand: string) {
    await this.searchBox.fill(brand)
    await this.page.keyboard.press('Enter')

    const matches = this.page.locator(`text=${brand}`)
    await expect(matches).toHaveCount(0, { timeout: 15000 })
  }

  async verifyAccordionHeadings() {
    const headings = [
      'Global Traffic Insights',
      'Track Top Traffic Pages',
      'Unlock Brand Rankings',
      'Discover Related Websites',
      'Track Your Competition and Their Affiliates'
    ]
    for (const text of headings) {
      const normalizedText = text.trim()
      const locator = this.page.getByText(normalizedText, { exact: false }).first()
      await expect(locator).toBeVisible({ timeout: 15000 })
      await locator.evaluate((node) => {
        ;(node as HTMLElement).style.border = '2px solid #00ffcc'
        ;(node as HTMLElement).style.padding = '4px'
      })
    }
  }
}
