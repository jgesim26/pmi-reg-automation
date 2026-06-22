import { expect, Locator, Page } from '@playwright/test';

/** Default timeout (ms) used by the shared wait/verify helpers. */
export const DEFAULT_TIMEOUT = 20000;

export class BasePage {
  constructor(protected page: Page) {}

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to a path and wait until the network is idle by default.
   * Subclasses can still override for page-specific behaviour.
   */
  async navigateTo(
    path: string,
    options?: Parameters<Page['goto']>[1],
  ) {
    await this.page.goto(path, {
      waitUntil: 'networkidle',
      timeout: 60000,
      ...options,
    });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // ---------------------------------------------------------------------------
  // Assertions / waits
  // ---------------------------------------------------------------------------

  /** Assert the current URL matches `urlPattern`. */
  async expectUrl(urlPattern: RegExp | string, timeout = DEFAULT_TIMEOUT) {
    await expect(this.page).toHaveURL(urlPattern, { timeout });
  }

  /**
   * Wait for `urlPattern` to load and the network to settle, then assert it
   * happened within `seconds`. Returns the measured load duration in seconds.
   */
  async verifyUrlLoadedWithin(
    urlPattern: RegExp | string,
    seconds = DEFAULT_TIMEOUT / 1000,
    label = 'Page',
  ): Promise<number> {
    const start = Date.now();

    await this.expectUrl(urlPattern, seconds * 1000);
    await this.waitForNetworkIdle();

    const duration = (Date.now() - start) / 1000;
    console.log(`⏱️ ${label} loaded in ${duration.toFixed(2)}s`);
    expect(duration).toBeLessThanOrEqual(seconds);
    return duration;
  }

  // ---------------------------------------------------------------------------
  // Visual helpers
  // ---------------------------------------------------------------------------

  /**
   * Outline an element to make it obvious in screenshots/recordings.
   * Replaces the border-styling snippet that was duplicated across pages.
   */
  async highlight(locator: Locator, color = '#00ffcc') {
    await locator.evaluate((node, c) => {
      const el = node as HTMLElement;
      el.style.border = `3px solid ${c}`;
      el.style.padding = '4px';
    }, color);
  }

  async captureScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueSuffix = Math.random().toString(16).slice(2, 10);
    await this.page.screenshot({
      path: `./screenshots/${timestamp}-${uniqueSuffix}-${name}.png`,
      fullPage: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Table helpers
  // ---------------------------------------------------------------------------

  /**
   * Verify a `<table>` exists and has at least one row. When `failIfEmpty` is
   * false, a missing table is logged and tolerated instead of failing.
   *
   * Named `assertTableHasData` (not `verifyTableHasData`) so subclasses are
   * free to keep their own page-specific `verifyTableHasData` overrides.
   */
  async assertTableHasData(
    table: Locator = this.page.getByRole('table'),
    failIfEmpty = true,
  ): Promise<number> {
    const tableCount = await table.count();
    if (tableCount === 0) {
      console.log('⚠️ No table found on this page');
      if (failIfEmpty) {
        expect(tableCount, 'Expected a data table on the page').toBeGreaterThan(0);
      }
      return 0;
    }

    await expect(table).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    const rowCount = await table.locator('tr:visible').count();

    if (rowCount > 0) {
      await this.highlight(table, '#28a745');
    }

    expect(rowCount, 'Data table should not be empty').toBeGreaterThan(0);
    return rowCount;
  }
}
