import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TasksPage } from '../pages/tasks.page';
import { loginViaApi } from '../utils/api';

type Fixtures = {
  loginPage: LoginPage;
  tasksPage: TasksPage;
  /** Bearer token obtained through the API (no UI involved). */
  apiToken: string;
  /** Page that is already signed in: token injected before the app loads. */
  signedInPage: TasksPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  tasksPage: async ({ page }, use) => use(new TasksPage(page)),

  apiToken: async ({ request }, use) => use(await loginViaApi(request)),

  signedInPage: async ({ page, apiToken }, use) => {
    await page.addInitScript((token) => sessionStorage.setItem('taskboard-token', token), apiToken);
    await page.goto('/');
    const tasksPage = new TasksPage(page);
    await expect(tasksPage.heading).toBeVisible();
    await use(tasksPage);
  }
});

export { expect };
