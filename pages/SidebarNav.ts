import { expect, Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * The left navigation drawer. Entries are anchors carrying the target route in
 * their href, so navigation is driven by href (resilient to the "New" badges).
 *
 * The groups (Organic Traffic / PPC / Streamers) behave as an ACCORDION — only
 * one is open at a time — so to click a nested link we first open its group.
 * Collapsed links still exist in the DOM, which is why presence is checked by
 * count and clickability by opening the right group.
 */
export class SidebarNav extends BasePage {
  get drawer(): Locator {
    return this.page.locator('.q-drawer, aside').first()
  }

  async waitForReady() {
    await this.drawer.waitFor({ state: 'visible', timeout: 20000 })
    await this.page.waitForTimeout(800)
  }

  /** The nav link for a given route (matched by href). */
  link(route: string): Locator {
    return this.drawer.locator(`a[href="${route}"], a[href^="${route}?"]`).first()
  }

  /** Whether a nav entry for `route` exists in the DOM (regardless of group state). */
  async hasLink(route: string): Promise<boolean> {
    const loc = this.link(route)
    const end = Date.now() + 5000
    while (Date.now() < end) {
      if ((await loc.count()) > 0) return true
      await this.page.waitForTimeout(300)
    }
    return false
  }

  /** Open the accordion group with the given label so its links become visible. */
  async openGroup(label: string) {
    const header = this.drawer.locator('.q-item').filter({ hasText: label }).first()
    if (await header.count()) {
      await header.click().catch(() => {})
      await this.page.waitForTimeout(600)
    }
  }

  /**
   * Click the nav link for `route` and wait until the URL reflects it. Opens the
   * containing accordion group first when the link isn't already visible.
   */
  async navigate(route: string, urlContains: string, group?: string) {
    const link = this.link(route)
    // Open the containing accordion group, retrying since opening one group can
    // close another and the submenu can render partially under load. openGroup
    // toggles, so re-check; poll for the link to render after each expand.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await link.isVisible().catch(() => false)) break
      if (group && group !== 'Root') await this.openGroup(group)
      const end = Date.now() + 3500
      while (Date.now() < end) {
        if (await link.isVisible().catch(() => false)) break
        await this.page.waitForTimeout(300)
      }
    }
    await expect(link, `sidebar link for ${route} should be present`).toBeVisible({ timeout: 8000 })
    await link.scrollIntoViewIfNeeded().catch(() => {})
    await link.click()
    await this.page.waitForURL((url) => url.href.includes(urlContains), { timeout: 30000 })
  }
}
