import { expect, Locator, Page } from '@playwright/test'
import { BasePage, DEFAULT_TIMEOUT } from './BasePage'

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class StagePage extends BasePage {
  readonly pageHeading: Locator
  readonly searchInput: Locator
  readonly table: Locator

  constructor(page: Page) {
    super(page)
    this.pageHeading = page.locator('h1, h2, [data-testid="page-title"], .page-title').first()
    this.searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[name*="search" i], input[id*="search" i]',
    ).first()
    this.table = page.locator('table').first()
  }

  async verifyPageLoaded(route: string) {
    const urlPattern = new RegExp(escapeRegex(route))
    await this.expectUrl(urlPattern)
    await this.waitForNetworkIdle()
    if (await this.pageHeading.count()) {
      await expect(this.pageHeading).toBeVisible({ timeout: DEFAULT_TIMEOUT })
    }
  }

  async verifyTableHasData(failIfEmpty = true) {
    await this.assertTableHasData(this.table, failIfEmpty)
  }

  async verifySearchAvailable() {
    await expect(this.searchInput).toBeVisible({ timeout: DEFAULT_TIMEOUT })
  }

  async submitSearch(searchTerm: string) {
    await this.verifySearchAvailable()
    await this.searchInput.fill(searchTerm)
    await this.page.keyboard.press('Enter')
    await this.page.waitForLoadState('networkidle')
    const resultRow = this.page.locator('table tr, [role="row"], .search-result').first()
    await expect(resultRow).toBeVisible({ timeout: DEFAULT_TIMEOUT })
  }
}
