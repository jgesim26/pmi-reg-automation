import { test, expect, Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { WebsiteOverviewPage } from '../pages/WebsiteOverviewPage'
import { recordRoute } from './url-annotation'

recordRoute()

const emailInput = (page: Page) =>
  page.locator('input[type="email"], input[placeholder*="user" i], input[placeholder*="email" i]').first()
const passwordInput = (page: Page) =>
  page.locator('input[type="password"], input[placeholder*="password" i]').first()
const submitButton = (page: Page) => page.getByRole('button', { name: /login|sign in/i }).first()

// ---------------------------------------------------------------------------
// Login form — field validation (runs logged-out, overriding the storageState)
// ---------------------------------------------------------------------------
test.describe('Login form validation', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await emailInput(page).waitFor({ state: 'visible', timeout: 20000 })
  })

  test('positive: submit enables once both fields are filled', async ({ page }) => {
    // Negative state: empty form → submit disabled.
    await expect(submitButton(page), 'submit should be disabled with empty fields').toBeDisabled()
    // Positive state: valid email + password → submit enabled.
    await emailInput(page).fill('user@example.com')
    await passwordInput(page).fill('SomePassword123')
    await expect(submitButton(page), 'submit should enable when both fields are valid').toBeEnabled()
  })

  test('negative: rejects an invalid email format', async ({ page }) => {
    await emailInput(page).fill('notanemail')
    await passwordInput(page).fill('whatever123') // filling password blurs the email → triggers validation
    await expect(
      page.getByText(/not a valid email/i).first(),
      'an inline "not a valid email" error should appear',
    ).toBeVisible({ timeout: 8000 })
  })

  test('negative: shows an error for wrong credentials', async ({ page }) => {
    const login = new LoginPage(page)
    await login.loginInvalid('wrong.user@example.com', 'wrongPassword123!')
    await expect(page.getByText(/invalid username or password/i).first()).toBeVisible()
  })

  // NOTE: the end-to-end positive login (valid credentials → Website Overview) is
  // covered by auth.setup.ts on every run. We deliberately don't repeat a fresh
  // login here because the suite authenticates via cached storageState, so a raw
  // USER_PASS isn't reliably present locally (only the positive field-validation
  // case above is asserted).
})

// ---------------------------------------------------------------------------
// Brand search — input validation (runs authenticated, default storageState)
// ---------------------------------------------------------------------------
test.describe('Search field validation', () => {
  let overview: WebsiteOverviewPage

  test.beforeEach(async ({ page }) => {
    overview = new WebsiteOverviewPage(page)
    await overview.navigateTo('/organic-traffic/website-analysis/website-overview')
  })

  test('positive: a valid brand search returns a result', async () => {
    await overview.searchAndSelectBrand('BET365')
  })

  test('negative: an unknown brand returns no results', async () => {
    await overview.verifyNoSearchResults('1exampleBET365')
  })

  /** Type a value into the brand search and submit, returning whether the page broke. */
  const runSearch = async (page: Page, value: string): Promise<boolean> => {
    const search = page.getByPlaceholder(/search/i).first()
    await search.waitFor({ state: 'visible', timeout: 20000 })
    await expect(search).toBeEditable({ timeout: 10000 })
    await search.click()
    await search.fill(value)
    await search.press('Enter')
    await page.waitForTimeout(2000)
    return page.getByText(/something went wrong|unexpected error/i).first().isVisible().catch(() => false)
  }

  test('negative: special characters do not break the page', async ({ page }) => {
    const broke = await runSearch(page, '@#$%^&*(){}[]')
    expect(broke, 'special-character search should not crash the page').toBeFalsy()
    await expect(page.getByPlaceholder(/search/i).first()).toBeEditable()
  })

  test('negative: an empty/whitespace search does not break the page', async ({ page }) => {
    const broke = await runSearch(page, '   ')
    expect(broke, 'whitespace search should not crash the page').toBeFalsy()
    await expect(page.getByPlaceholder(/search/i).first()).toBeEditable()
  })
})
