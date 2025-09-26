import { Locator, Page } from '@playwright/test';

export async function login(page: Page, username?: string, password?: string) {

  await page.goto('/'); 

  await page.getByPlaceholder('username').fill(username || 'jayson.gesim@everymatrix.com');
  await page.getByPlaceholder('Password').fill(password || 'fff');
  await page.getByRole('button', { name: 'Login' }).click();
  console.log('User has successfully logged in.')
  setTimeout(() => { 
    }, 5000);
}

export const USER_CREDENTIALS = {
  username: 'jayson.gesim@everymatrix.com',
  password: 'fff',
};
// export const INVALID_USER_CREDENTIALS = {
//   invalusername: 'jayson.gesim@everymatrixX.com',
//   invalpassword: '1233',
// };

function expect(arg0: Locator) {
  throw new Error('Function not implemented.');
}


