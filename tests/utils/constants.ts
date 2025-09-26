import { Locator, Page } from '@playwright/test';

export async function login(page: Page, username?: string, password?: string) {

  await page.goto('/'); 

  await page.getByPlaceholder('username').fill(username || 'jayson.gesim@everymatrix.com');
<<<<<<< HEAD
  await page.getByPlaceholder('Password').fill(password || 'fff');
=======
  await page.getByPlaceholder('Password').fill(password || '12345678');
>>>>>>> a9dcb204f226a6999eb98fe3d5382c5a99b1e69f
  await page.getByRole('button', { name: 'Login' }).click();
  console.log('User has successfully logged in.')
  setTimeout(() => { 
    }, 5000);
}

export const USER_CREDENTIALS = {
  username: 'jayson.gesim@everymatrix.com',
<<<<<<< HEAD
  password: 'fff',
=======
  password: '12345678',
};
export const INVALID_USER_CREDENTIALS = {
  invalusername: 'jayson.gesim@everymatrixX.com',
  invalpassword: '1233',
>>>>>>> a9dcb204f226a6999eb98fe3d5382c5a99b1e69f
};
// export const INVALID_USER_CREDENTIALS = {
//   invalusername: 'jayson.gesim@everymatrixX.com',
//   invalpassword: '1233',
// };

function expect(arg0: Locator) {
  throw new Error('Function not implemented.');
}


