import { Page } from '@playwright/test';

export async function login(page: Page, username?: string, password?: string) {

  await page.goto('/'); 

  await page.getByPlaceholder('username').fill(username || 'jayson.gesim@everymatrix.com');
  await page.getByPlaceholder('Password').fill(password || '12345678');
  await page.getByRole('button', { name: 'Login' }).click();
  setTimeout(() => { 
    }, 5000);
}

export const USER_CREDENTIALS = {
  username: 'jayson.gesim@everymatrix.com',
  password: '12345678',
};
export const INVALID_USER_CREDENTIALS = {
  invalusername: 'jayson.gesim@everymatrixX.com',
  invalpassword: '1233',
};

