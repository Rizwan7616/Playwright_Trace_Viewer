import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Authentication UI', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid user can sign in and see the task board', async ({ loginPage, tasksPage }) => {
    await loginPage.login();
    await expect(tasksPage.heading).toBeVisible();
    await expect(tasksPage.welcome).toHaveText('Signed in as QA Engineer');
  });

  test('wrong password shows a useful error and stays on the login form', async ({ loginPage, tasksPage }) => {
    await loginPage.login('qa@example.com', 'wrong-password');
    await expect(loginPage.error).toHaveText('Invalid email or password');
    await expect(tasksPage.heading).toBeHidden();
  });

  test('unknown email is rejected', async ({ loginPage }) => {
    await loginPage.login('nobody@example.com', 'Password123!');
    await expect(loginPage.error).toHaveText('Invalid email or password');
  });

  test('error message clears after a successful retry', async ({ loginPage, tasksPage }) => {
    await loginPage.login('qa@example.com', 'wrong-password');
    await expect(loginPage.error).toHaveText('Invalid email or password');
    await loginPage.login();
    await expect(tasksPage.heading).toBeVisible();
    await expect(loginPage.error).toBeEmpty();
  });

  test('empty email is blocked by browser validation', async ({ loginPage, tasksPage }) => {
    await loginPage.email.fill('');
    await loginPage.submitButton.click();
    await expect(loginPage.email).toBeFocused();
    await expect(tasksPage.heading).toBeHidden();
  });

  test('signing out returns to the login form', async ({ loginPage, tasksPage }) => {
    await loginPage.login();
    await tasksPage.signOutButton.click();
    await expect(loginPage.heading).toBeVisible();
    await expect(tasksPage.heading).toBeHidden();
  });

  test('session survives a reload and is dropped after sign out', async ({ page, loginPage, tasksPage }) => {
    await loginPage.login();
    await expect(tasksPage.heading).toBeVisible();

    await page.reload();
    await expect(tasksPage.heading).toBeVisible();

    await tasksPage.signOutButton.click();
    await page.reload();
    await expect(loginPage.heading).toBeVisible();
  });
});
