import { expect, Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/** The five top-level tabs of the Settings area. */
export type SettingsTab = 'Profile' | 'Account' | 'Activity' | 'Security' | 'Billing'

export interface SettingsTabDef {
  name: SettingsTab
  /** Stable substring the URL should contain once the tab is active. */
  urlContains: string
}

/**
 * The Settings area (`/settings`). It opens on the Profile tab and exposes five
 * top-level tabs, each of which routes to its own sub-path:
 *
 *   Profile  -> /settings/profile-settings          (Edit Profile form)
 *   Account  -> /settings/manage-account/...         (Preferences / Brands / Users / ...)
 *   Activity -> /settings/activity-log/activities    (activity log table)
 *   Security -> /settings/security                   (Reset Password form)
 *   Billing  -> /settings/billing                    (billing info + invoices table)
 *
 * Forms are Quasar `q-field`s — the editable element is an <input> inside the
 * `.q-field` whose `.q-field__label` carries the human label, which is what
 * `fieldByLabel` resolves.
 *
 * NOTE: methods here are intentionally read-only verifications. The page edits a
 * live account (profile, password), so the spec never submits Save to avoid
 * mutating real data.
 */
export class SettingsPage extends BasePage {
  static readonly ROUTE = '/settings'

  static readonly TABS: SettingsTabDef[] = [
    { name: 'Profile', urlContains: '/settings/profile' },
    { name: 'Account', urlContains: '/settings/manage-account' },
    { name: 'Activity', urlContains: '/settings/activity' },
    { name: 'Security', urlContains: '/settings/security' },
    { name: 'Billing', urlContains: '/settings/billing' },
  ]

  /** Account sub-tabs (second-level navigation under the Account tab). */
  static readonly ACCOUNT_SUBTABS = [
    'Preferences',
    'Favorites',
    'Brands',
    'Users',
    'Blacklist',
    'Notifications',
  ]

  // --- scopes ---------------------------------------------------------------
  private get main(): Locator {
    return this.page.locator('main, .q-page-container, [role="main"]').first()
  }

  get heading(): Locator {
    return this.page.getByText('Settings', { exact: true }).first()
  }

  /** A top-level tab locator, matched on its exact trimmed label. */
  tab(name: SettingsTab): Locator {
    return this.page
      .locator('.q-tab, [role="tab"]')
      .filter({ hasText: new RegExp(`^\\s*${name}\\s*$`, 'i') })
      .first()
  }

  /** The <input> belonging to the Quasar field whose label matches `label`. */
  fieldByLabel(label: string | RegExp): Locator {
    const re = typeof label === 'string' ? new RegExp(label, 'i') : label
    return this.main
      .locator('.q-field')
      .filter({ has: this.page.locator('.q-field__label', { hasText: re }) })
      .first()
      .locator('input, textarea')
      .first()
  }

  // --- lifecycle ------------------------------------------------------------

  /** Go to /settings and wait for the tab bar to render. */
  async open() {
    await this.page.goto(SettingsPage.ROUTE, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await this.waitForReady()
  }

  async waitForReady() {
    await this.page
      .locator('.q-drawer, aside')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => {})
    await expect(this.tab('Profile'), 'Settings tab bar should render').toBeVisible({ timeout: 20000 })
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  }

  /** Click a top-level tab and wait until the URL reflects it. */
  async openTab(name: SettingsTab) {
    const def = SettingsPage.TABS.find((t) => t.name === name)!
    const tab = this.tab(name)
    await expect(tab, `Settings "${name}" tab should be present`).toBeVisible({ timeout: 10000 })
    await tab.click()
    await this.page.waitForURL((url) => url.href.includes(def.urlContains), { timeout: 20000 })
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await this.page.waitForTimeout(800)
  }

  /** Whether every top-level tab is present in the DOM. */
  async allTabsPresent(): Promise<{ name: SettingsTab; ok: boolean }[]> {
    const out: { name: SettingsTab; ok: boolean }[] = []
    for (const t of SettingsPage.TABS) {
      out.push({ name: t.name, ok: (await this.tab(t.name).count()) > 0 })
    }
    return out
  }

  // --- Profile tab ----------------------------------------------------------
  get firstNameInput(): Locator {
    return this.fieldByLabel(/first name/i)
  }
  get lastNameInput(): Locator {
    return this.fieldByLabel(/last name/i)
  }
  get emailInput(): Locator {
    return this.fieldByLabel(/email/i)
  }
  get roleSelect(): Locator {
    return this.main.locator('.q-select').first()
  }
  get saveButton(): Locator {
    return this.main.getByRole('button', { name: /save changes/i }).first()
  }

  // --- Security tab ---------------------------------------------------------
  get currentPasswordInput(): Locator {
    return this.fieldByLabel(/current password/i)
  }
  get newPasswordInput(): Locator {
    return this.fieldByLabel(/^new password/i)
  }
  get confirmPasswordInput(): Locator {
    return this.fieldByLabel(/confirm new password/i)
  }

  // --- Account tab ----------------------------------------------------------
  /** An Account sub-tab (Preferences / Brands / Users / ...). */
  accountSubTab(label: string): Locator {
    return this.main
      .locator('.q-tab, [role="tab"], .q-item')
      .filter({ hasText: new RegExp(`^\\s*${label}\\s*$`, 'i') })
      .first()
  }

  async accountSubTabsPresent(): Promise<{ label: string; ok: boolean }[]> {
    const out: { label: string; ok: boolean }[] = []
    for (const label of SettingsPage.ACCOUNT_SUBTABS) {
      out.push({ label, ok: (await this.accountSubTab(label).count()) > 0 })
    }
    return out
  }

  // --- tables (Activity / Billing) -----------------------------------------
  get table(): Locator {
    return this.main.getByRole('table').first()
  }
  get tableRows(): Locator {
    return this.table.locator('tbody tr').filter({ hasText: /\S/ })
  }

  /** Poll the table row count until it is > 0 or the timeout elapses. */
  async waitForRows(timeout = 12000): Promise<number> {
    const end = Date.now() + timeout
    let n = await this.tableRows.count()
    while (n === 0 && Date.now() < end) {
      await this.page.waitForTimeout(500)
      n = await this.tableRows.count()
    }
    return n
  }

  /** True when a fatal error overlay is shown. */
  async hasFatalError(): Promise<boolean> {
    return this.page
      .getByText(/something went wrong|internal server error|unexpected error|failed to load|access denied|404: not found/i)
      .first()
      .isVisible()
      .catch(() => false)
  }

  async shot(key: string) {
    await this.page
      .screenshot({ path: `./screenshots/settings-${key}.png`, fullPage: true })
      .catch(() => {})
  }
}
