export async function login(page, username?: string, password?: string) {

  await page.goto('/'); 

  await page.getByPlaceholder('username').fill(username || 'jayson.gesim@everymatrix.com');
  await page.getByPlaceholder('Password').fill(password || '123');
  await page.getByRole('button', { name: 'Login' }).click();
  // await expect(page.getByText('Welcome,')).toBeVisible(); // Adjust based on your app's success message
}

export const USER_CREDENTIALS = {
  username: 'jayson.gesim@everymatrix.com',
  password: '123',
};
export const INVALID_USER_CREDENTIALS = {
  invalusername: 'jayson.gesim@everymatrixX.com',
  invalpassword: '1233',
};

