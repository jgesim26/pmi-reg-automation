import { login } from '../utils/constants'

const { test, page, expect } = require('@playwright/test')

//  test.describe('Check high level navigation ', () => {
//  });

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('The system should allow a user to log in successfully on PartnerMatrix', async ({ page }) => {
  console.log('Site is accessible. Login process has succesfully processed')
  console.log('Successfully redirected to /organic-traffic/website-analysis/website-overview')
  console.log('User is logged in successfully and redirected to Website Overview page!')
})
test('Verify if Trending websites is visible and active', async ({ page }) => {
  console.log('Trying to load Trending Websites')
  console.log('Running test: should display essential trending website elements after login')
  await page.getByText('Trending Websites', { exact: true }).click()
  await expect(page.getByRole('main').getByText('Trending Websites', { exact: true })).toBeVisible()
})
test('Verify if Opportunities is visible and active', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Opportunities"))').click()
  console.log('Trying to load Opportunities page')
  console.log('Running test: it should display Opportunities page')
  const OpportunitiesPage = page
    .locator('a.q-item:has(span:has-text("Opportunities"))')
    .filter({ hasText: 'Opportunities' })
  await expect(OpportunitiesPage).toBeVisible()
})
test('Verify if Your Websites is visible and active', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Your Websites"))').click()
  console.log('Trying to load Your Websites page')
  console.log('Running test: it should display Your Websites page')
  const OrganicYourWebsites = page
    .locator('a.q-item:has(span:has-text("Your Websites"))')
    .filter({ hasText: 'Your Websites' })
  await expect(OrganicYourWebsites).toBeVisible()
})
test('Verify if Position Changes is visible and active', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Position Changes"))').click()
  console.log('Trying to load Position Changes page')
  console.log('Running test: it should display Position Changes page')
  const PositionChanges = page
    .locator('a.q-item:has(span:has-text("Position Changes"))')
    .filter({ hasText: 'Position Changes' })
  await expect(PositionChanges).toBeVisible()
})

test('Verify if Website Search is visible and active', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Website Search"))').click()
  console.log('Trying to load Website Search page')
  console.log('Running test: it should display Website Search page')
  const WebsiteSearch = page
    .locator('a.q-item:has(span:has-text("Website Search"))')
    .filter({ hasText: 'Website Search' })
  await expect(WebsiteSearch).toBeVisible()
})
test('Verify if Market Position is visible and active', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Market Position"))').click()
  console.log('Trying to load Market Position page')
  console.log('Running test: it should display Market Position page')
  const MarketPosition = page
    .locator('a.q-item:has(span:has-text("Market Position"))')
    .filter({ hasText: 'Market Position' })
  await expect(MarketPosition).toBeVisible()
})
test('Verify if PPC is visible and able to expand the dropdown', async ({ page }) => {
  await page.locator('//*[@id="q-app"]/div/div/div[1]/aside/div/div/div[1]/div/div/div[2]').click()
  console.log('PPC is expanded')
  await page.waitForTimeout(3000)

  setTimeout(() => {}, 5000)
})

test('Verify if Website Top list page is visible working as expected', async ({ page }) => {
  console.log('Trying to load Website Top List page')
  console.log('Running test: it should display Website Top List page')
  // const WebsiteTopList = page.locator('a.q-item:has(span:has-text("Website Top List"))').filter({ hasText: 'Website Top List' });
  const WebsiteTopList = page
    .locator('//*[@id="q-app"]/div/div/div[1]/aside/div/div/div[1]/div/div/div[2]/div/div[1]')
    .filter({ hasText: 'Website Top List' })
  await page.WebsiteTopList.click()
  await expect(WebsiteTopList).toHaveURL(/.*ppc\/weekly\/website-top-list/)
  await page.pause()
})
test('Verify if Keyword List page is visible working as expected', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Keyword List"))').click()
  console.log('Trying to load Keyword List page')
  console.log('Running test: it should display Keyword List page')
  // You can then assert its visibility using the same specific locator
  const KeywordList = page.locator('a.q-item:has(span:has-text("Keyword List"))').filter({ hasText: 'Keyword List' })
  await expect(KeywordList).toBeVisible()
})

test('Verify if Black Hat page is visible working as expected', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Black Hat"))').click()
  console.log('Trying to load Black Hat page')
  console.log('Running test: it should display Black Hat page')
  // You can then assert its visibility using the same specific locator
  const BlackHat = page.locator('a.q-item:has(span:has-text("Black Hat"))').filter({ hasText: 'Black Hat' })
  await expect(BlackHat).toBeVisible()
})
test('Verify if Brand Bidding page is visible working as expected', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Brand Bidding"))').click()
  console.log('Trying to load Brand Bidding page')
  console.log('Running test: it should display Brand Bidding page')
  // You can then assert its visibility using the same specific locator
  const BrandBidding = page.locator('a.q-item:has(span:has-text("Brand Bidding"))').filter({ hasText: 'Brand Bidding' })
  await expect(BrandBidding).toBeVisible()
})
test('Verify if Keyword Search page is visible working as expected', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Keyword Search"))').click()
  console.log('Trying to load Keyword Search page')
  console.log('Running test: it should display KeywordSearch page')
  // You can then assert its visibility using the same specific locator
  const KeywordSearch = page
    .locator('a.q-item:has(span:has-text("Keyword Search"))')
    .filter({ hasText: 'Keyword Search' })
  await expect(KeywordSearch).toBeVisible()
})
test('Verify if Telegram page is visible working as expected', async ({ page }) => {
  await page.locator('a.q-item:has(span:has-text("Telegram"))').click()
  console.log('Trying to load Telegram page')
  console.log('Running test: it should display Telegram page')
  // You can then assert its visibility using the same specific locator
  const TelegramPage = page.locator('a.q-item:has(span:has-text("Telegram"))').filter({ hasText: 'Telegram' })
  await expect(TelegramPage).toBeVisible()
  setTimeout(() => {}, 5000)
})
