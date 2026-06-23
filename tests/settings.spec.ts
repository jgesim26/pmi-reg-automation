import { test, expect } from '@playwright/test'
import { SettingsPage } from '../pages/SettingsPage'

/**
 * End-user verification of the Settings area (`/settings`). Uses the shared auth
 * storage state (configured via the `setup` project dependency), so each test
 * starts already signed in and simply navigates to Settings.
 *
 * These checks are deliberately READ-ONLY: the Profile and Security tabs edit a
 * live account, so we verify the forms render and are usable but never submit
 * Save / Reset Password — the suite must not mutate the real account.
 */
test.describe('Settings', () => {
  test('loads and exposes all top-level tabs', async ({ page }) => {
    test.setTimeout(60000)
    const settings = new SettingsPage(page)
    await settings.open()

    await expect(settings.heading, 'Settings heading should be visible').toBeVisible()

    const tabs = await settings.allTabsPresent()
    for (const t of tabs) {
      console.log(`   ${t.ok ? '✅' : '❌'} tab "${t.name}"`)
      expect.soft(t.ok, `Settings tab "${t.name}" should be present`).toBeTruthy()
    }

    expect(await settings.hasFatalError(), 'Settings should load without a fatal error').toBeFalsy()
    await settings.shot('overview')
  })

  // Each tab is its own isolated test (fresh page) so a slow tab can't cascade.
  for (const def of SettingsPage.TABS) {
    test(`tab → ${def.name} navigates and renders`, async ({ page }) => {
      test.setTimeout(60000)
      const settings = new SettingsPage(page)
      await settings.open()
      await settings.openTab(def.name)

      expect(page.url(), `${def.name} tab should route to ${def.urlContains}`).toContain(def.urlContains)
      expect(await settings.hasFatalError(), `${def.name} tab should load without a fatal error`).toBeFalsy()
      await settings.shot(def.name.toLowerCase())
      console.log(`   ✅ ${def.name} -> ${page.url().replace(/^https?:\/\/[^/]+/, '')}`)
    })
  }

  test('Profile tab shows the editable profile form (read-only check)', async ({ page }) => {
    test.setTimeout(60000)
    const settings = new SettingsPage(page)
    await settings.open()
    await settings.openTab('Profile')

    await expect(settings.firstNameInput, 'First Name field').toBeVisible()
    await expect(settings.lastNameInput, 'Last Name field').toBeVisible()
    await expect(settings.emailInput, 'Email field').toBeVisible()
    await expect(settings.roleSelect, 'Role select').toBeVisible()
    await expect(settings.saveButton, 'Save Changes button').toBeVisible()

    // The account's email should be pre-populated.
    const email = await settings.emailInput.inputValue().catch(() => '')
    console.log(`   ℹ️ profile email = "${email}"`)
    expect(email, 'Email field should be pre-filled').toContain('@')
  })

  test('Security tab shows the reset-password form (read-only check)', async ({ page }) => {
    test.setTimeout(60000)
    const settings = new SettingsPage(page)
    await settings.open()
    await settings.openTab('Security')

    await expect(settings.currentPasswordInput, 'Current Password field').toBeVisible()
    await expect(settings.newPasswordInput, 'New Password field').toBeVisible()
    await expect(settings.confirmPasswordInput, 'Confirm New Password field').toBeVisible()

    // Password inputs must mask their value.
    await expect(settings.currentPasswordInput).toHaveAttribute('type', 'password')
  })

  test('Account tab exposes its sub-sections', async ({ page }) => {
    test.setTimeout(60000)
    const settings = new SettingsPage(page)
    await settings.open()
    await settings.openTab('Account')

    const subTabs = await settings.accountSubTabsPresent()
    for (const s of subTabs) {
      console.log(`   ${s.ok ? '✅' : '⚠️'} account section "${s.label}"`)
    }
    // Preferences and Brands are the core sections — assert those at minimum.
    const byLabel = Object.fromEntries(subTabs.map((s) => [s.label, s.ok]))
    expect.soft(byLabel['Preferences'], 'Preferences section').toBeTruthy()
    expect.soft(byLabel['Brands'], 'Brands section').toBeTruthy()
  })

  test('Activity tab renders the activity log table with rows', async ({ page }) => {
    test.setTimeout(60000)
    const settings = new SettingsPage(page)
    await settings.open()
    await settings.openTab('Activity')

    // The activity log table is populated by an async fetch, so allow more than
    // the default expect timeout for it to appear.
    await expect(settings.table, 'Activity log table').toBeVisible({ timeout: 20000 })
    const rows = await settings.waitForRows()
    console.log(`   ℹ️ activity rows = ${rows}`)
    expect(rows, 'Activity log should list at least one entry').toBeGreaterThan(0)
  })

  test('Billing tab renders billing info and the invoices table', async ({ page }) => {
    test.setTimeout(60000)
    const settings = new SettingsPage(page)
    await settings.open()
    await settings.openTab('Billing')

    await expect(page.getByText(/billing info/i).first(), 'Billing Info section').toBeVisible({ timeout: 20000 })
    await expect(settings.table, 'Invoices table').toBeVisible({ timeout: 20000 })
    const rows = await settings.waitForRows()
    console.log(`   ℹ️ invoice rows = ${rows}`)
    expect.soft(rows, 'Invoices table may list past invoices').toBeGreaterThanOrEqual(0)
  })
})
