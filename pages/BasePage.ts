import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async captureScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `./screenshots/${name}.png`, 
      fullPage: true 
    });
  }
}