import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async captureScreenshot(name: string) {
    let date = Date.now().toString(2);
    await this.page.screenshot({ 
      path: `./screenshots/${date}-${name}.png`, 
      fullPage: true 
    });
  }
}