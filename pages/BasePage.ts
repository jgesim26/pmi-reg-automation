import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async captureScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueSuffix = Math.random().toString(16).slice(2, 10);
    await this.page.screenshot({
      path: `./screenshots/${timestamp}-${uniqueSuffix}-${name}.png`,
      fullPage: true,
    });
  }
}