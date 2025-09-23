import { TIMEOUT } from 'dns'
import { login } from '../utils/constants'

const { test, expect } = require('@playwright/test')

test.describe('Smoke test execution status', () => {})
// Test case 1: Login Flow
test('PMI Smoke Test', async ({ page, request }) => {
  await login(page)

  await expect(page.getByText('Website Overview')).toBeTruthy()

  await page.locator('a.q-item:has(span:has-text("Trending Websites"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/website-analysis\/trending-websites.*/)

  await page.locator('a.q-item:has(span:has-text("Opportunities"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/website-analysis\/opportunities\/page-gap/)

  await page.locator('a.q-tab:has(span:has-text("Location Gap"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/website-analysis\/opportunities\/location-gap/)

  await page.locator('a.q-tab:has(span:has-text("Related Websites"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/website-analysis\/opportunities\/related-website/)

  await page.locator('a.q-item:has(span:has-text("Your Websites"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/affiliate-monitoring\/your-websites/)

  await page.locator('a.q-item:has(span:has-text("Position Changes"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/affiliate-monitoring\/position-changes\/brand-promoted/)

  await page.locator('a.q-item:has(span:has-text("Website Search"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/market-research\/website-search/)

  await page.locator('a.q-item:has(span:has-text("Market Position"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/market-research\/market-position\/brand-market-share/)

  await page.locator('a.q-tab:has(span:has-text("Your Market Share"))').click()
  await expect(page).toHaveURL(/.*organic-traffic\/market-research\/market-position\/your-market-share/)

  await page.locator('div.q-item:has(div:has-text("PPC"))').click()
  await page.locator('a.q-item:has(span:has-text("Website Top List"))').click()
  await expect(page).toHaveURL(/.*ppc\/weekly\/website-top-list/)

  await page.locator('a.q-item:has(span:has-text("Keyword List"))').click()
  await expect(page).toHaveURL(/.*ppc\/weekly\/keyword-list/)
  console.log('Running test: it should display Keyword List page')

  await page.locator('a.q-item:has(span:has-text("Black Hat"))').click()
  await expect(page).toHaveURL(/.*ppc\/weekly\/black-hat/)
  console.log('Running test: it should display Black Hat page')

  await page.locator('a.q-item:has(span:has-text("Brand Bidding"))').click()
  await expect(page).toHaveURL(/.*ppc\/brand-bidding/)

  await page.locator('a.q-item:has(span:has-text("Keyword Search"))').click()
  await expect(page).toHaveURL(/.*keyword-search/)

  await page.locator('a.q-item:has(span:has-text("Telegram"))').click()
  await expect(page).toHaveURL(/.*telegram\/channels/)

  await page.locator('button.q-btn:has(span:has-text("Jayson Gesim"))').click()
  await page.locator('a.q-item:has(div:has-text("Profile Settings"))').click()
  await expect(page).toHaveURL(/.*\/settings\/profile-settings/)

  await page.locator('a.q-tab:has(span:has-text("Manage Account"))').click()
  await expect(page).toHaveURL(/.*settings\/manage-account\/your-preference/)

  await page.locator('a.q-tab:has(span:has-text("Activity Log"))').click()
  await expect(page).toHaveURL(/.*settings\/activity-log\/activities/)

  await page.locator('a.q-tab:has(span:has-text("Security"))').click()
  await expect(page).toHaveURL(/.*settings\/security/)

  await page.getByPlaceholder('Search website or brand').fill('covers.com')
})
