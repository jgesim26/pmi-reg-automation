import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, pass: string) {
    await this.page.goto('/');

    const emailLocator = this.page.locator(
      'input[type="email"], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[id*="user" i], input[placeholder*="Username" i], input[placeholder*="Email" i]'
    ).first();
    const passwordLocator = this.page.locator(
      'input[type="password"], input[name*="pass" i], input[id*="pass" i], input[placeholder*="Password" i]'
    ).first();

    await expect(emailLocator).toBeVisible({ timeout: 10000 });
    await expect(passwordLocator).toBeVisible({ timeout: 10000 });

    await emailLocator.fill(email);
    await passwordLocator.fill(pass);

    await this.page.getByRole('button', { name: /login/i }).click();

    const invalidCredentialsMessage = this.page.getByText(/invalid username or password/i);
    const successHeading = this.page.getByRole('heading', { name: /website overview/i });

    const result = await Promise.race([
      invalidCredentialsMessage.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'error'),
      successHeading.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'success'),
      this.page.waitForURL(/\/organic-traffic\/website-analysis\/website-overview/, { timeout: 30000 }).then(() => 'url'),
    ]);

    if (result === 'error' || (await invalidCredentialsMessage.isVisible())) {
      throw new Error('Login failed: invalid username or password. Verify USER_EMAIL and USER_PASS in .env.');
    }

    if (result !== 'success' && result !== 'url') {
      throw new Error('Login did not reach the expected page after authentication.');
    }
  }

  async loginInvalid(email: string, pass: string) {
    const attemptedPaths = ['/', '/login', '/auth/login'];
    let emailLocator: Locator | null = null;
    let passwordLocator: Locator | null = null;

    for (const path of attemptedPaths) {
      await this.page.goto(path);

      const candidateEmail = this.page.locator(
        'input[type="email"], input[type="text"], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[id*="user" i], input[placeholder*="Username" i], input[placeholder*="Email" i]'
      ).first();
      const candidatePassword = this.page.locator(
        'input[type="password"], input[name*="pass" i], input[id*="pass" i], input[placeholder*="Password" i]'
      ).first();

      if ((await candidateEmail.count()) && (await candidatePassword.count())) {
        emailLocator = candidateEmail;
        passwordLocator = candidatePassword;
        break;
      }
    }

    if (!emailLocator || !passwordLocator) {
      throw new Error('Login form not found. Verify the login path or selectors in LoginPage.loginInvalid.');
    }

    await expect(emailLocator).toBeVisible({ timeout: 10000 });
    await expect(passwordLocator).toBeVisible({ timeout: 10000 });

    await emailLocator.fill(email);
    await passwordLocator.fill(pass);
    await this.page.getByRole('button', { name: /login|sign in/i }).click();

    const invalidCredentialsMessage = this.page.getByText(/invalid username or password/i);
    await invalidCredentialsMessage.waitFor({ state: 'visible', timeout: 15000 });
  }
}

