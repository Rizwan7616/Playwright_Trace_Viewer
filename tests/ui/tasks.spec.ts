import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueTitle } from '../../utils/api';

test.describe('Task management UI', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login();
  });

  test('seeded tasks are listed with their completion state', async ({ tasksPage }) => {
    await expect(tasksPage.taskByTitle('Review regression suite')).toBeVisible();
    await expect(tasksPage.taskByTitle('Review regression suite')).not.toHaveClass(/done/);
    await expect(tasksPage.taskByTitle('Validate API contract')).toHaveClass(/done/);
  });

  test('user can add a task', async ({ tasksPage }) => {
    const title = uniqueTitle('Playwright task');
    await tasksPage.addTask(title);
    await expect(tasksPage.taskByTitle(title)).toBeVisible();
    await expect(tasksPage.taskInput).toBeEmpty();
  });

  test('user can complete and delete a task', async ({ tasksPage }) => {
    const title = uniqueTitle('Lifecycle task');
    await tasksPage.addTask(title);
    await expect(tasksPage.taskByTitle(title)).toBeVisible();

    await tasksPage.complete(title);
    await expect(tasksPage.taskByTitle(title)).toHaveClass(/done/);

    await tasksPage.remove(title);
    await expect(tasksPage.taskByTitle(title)).toHaveCount(0);
    await expect(tasksPage.heading).toBeVisible();
  });

  test('completed state is persisted across a reload', async ({ page, tasksPage }) => {
    const title = uniqueTitle('Persistence task');
    await tasksPage.addTask(title);
    await tasksPage.complete(title);
    await expect(tasksPage.taskByTitle(title)).toHaveClass(/done/);

    await page.reload();
    await expect(tasksPage.taskByTitle(title)).toHaveClass(/done/);
  });

  test('empty task title is blocked by browser validation', async ({ tasksPage }) => {
    await tasksPage.addButton.click();
    await expect(tasksPage.taskInput).toBeFocused();
  });

  test('whitespace only title is rejected by the server and surfaced to the user', async ({ tasksPage }) => {
    await tasksPage.addTask('     ');
    await expect(tasksPage.error).toHaveText('title is required');
  });

  test('input enforces the 80 character limit', async ({ tasksPage }) => {
    await tasksPage.taskInput.fill('x'.repeat(100));
    await expect(tasksPage.taskInput).toHaveValue('x'.repeat(80));
  });
});
