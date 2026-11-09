import { test, expect } from '../../fixtures/test-fixtures';
import { bearer, createTask, uniqueTitle, Task } from '../../utils/api';

// Hybrid tests: set up state through the fast API, verify behaviour through the UI (and vice versa).
test.describe('API and UI working together', () => {
  test('task created through the API appears in the UI without a UI login', async ({ page, request, apiToken, signedInPage }) => {
    const title = uniqueTitle('Seeded by API');
    await createTask(request, apiToken, title);

    await page.reload();
    await expect(signedInPage.taskByTitle(title)).toBeVisible();
  });

  test('task deleted in the UI is gone from the API', async ({ request, apiToken, signedInPage }) => {
    const title = uniqueTitle('Deleted in UI');
    await signedInPage.addTask(title);
    await expect(signedInPage.taskByTitle(title)).toBeVisible();

    await signedInPage.remove(title);
    await expect(signedInPage.taskByTitle(title)).toHaveCount(0);

    const { items } = (await (await request.get('/api/tasks', { headers: bearer(apiToken) })).json()) as { items: Task[] };
    expect(items.some((t) => t.title === title)).toBe(false);
  });

  test('task completed in the UI is reported as completed by the API', async ({ request, apiToken, signedInPage }) => {
    const title = uniqueTitle('Completed in UI');
    await signedInPage.addTask(title);
    await signedInPage.complete(title);
    await expect(signedInPage.taskByTitle(title)).toHaveClass(/done/);

    await expect
      .poll(async () => {
        const { items } = (await (await request.get('/api/tasks', { headers: bearer(apiToken) })).json()) as { items: Task[] };
        return items.find((t) => t.title === title)?.completed;
      })
      .toBe(true);
  });

  test('an invalid injected token falls back to the login form', async ({ page, loginPage }) => {
    await page.addInitScript(() => sessionStorage.setItem('taskboard-token', 'tampered'));
    await page.goto('/');
    await expect(loginPage.heading).toBeVisible();
  });
});
