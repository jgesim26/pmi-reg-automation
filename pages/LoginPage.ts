import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

 async login(email: string, pass: string) {
  await this.page.goto('https://stage.app.deepci.com/');
 
  await this.page.getByPlaceholder('Username').fill(email);
  await this.page.getByPlaceholder('Password').fill(pass);
 
  await this.page.getByRole('button', { name: 'Login' }).click();

  // 3. Wait for the redirect to complete
  await this.page.waitForURL(/\/organic-traffic\/website-analysis\/website-overview/);
}
}