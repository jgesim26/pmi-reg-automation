import { expect, Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

const DEFAULT_TIMEOUT = 20000

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

  async navigateTo(route: string) {
    await this.page.goto(route, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
  }

  async verifyPageLoaded(route: string) {
    const urlPattern = new RegExp(escapeRegex(route))
    await expect(this.page).toHaveURL(urlPattern, { timeout: DEFAULT_TIMEOUT })
    await this.page.waitForLoadState('networkidle')
    if (await this.pageHeading.count()) {
      await expect(this.pageHeading).toBeVisible({ timeout: DEFAULT_TIMEOUT })
    }
  }

  async verifyTableHasData(failIfEmpty = true) {
    const tableCount = await this.table.count()
    if (tableCount === 0) {
      if (failIfEmpty) {
        expect(tableCount, 'Expected a data table on the page').toBeGreaterThan(0)
      }
      return
    }

    await expect(this.table).toBeVisible({ timeout: DEFAULT_TIMEOUT })
    const rowCount = await this.table.locator('tr').count()
    expect(rowCount, 'Expected at least one row in the data table').toBeGreaterThan(0)
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
