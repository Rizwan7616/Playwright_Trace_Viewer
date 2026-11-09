import { test, expect } from '../../fixtures/test-fixtures';
import { bearer, createTask, uniqueTitle, CREDENTIALS, Task } from '../../utils/api';

test.describe('Auth API', () => {
  test('login returns a token and the user profile without the password', async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: CREDENTIALS });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ accessToken: expect.any(String), user: { email: CREDENTIALS.email, name: 'QA Engineer' } });
    expect(body.user).not.toHaveProperty('password');
  });

  test('login rejects wrong credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: { email: CREDENTIALS.email, password: 'nope' } });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid email or password' });
  });

  test('login rejects a missing body', async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: {} });
    expect(response.status()).toBe(401);
  });

  test('login rejects malformed JSON with 400', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: Buffer.from('{not valid json')
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid JSON' });
  });

  test('login rejects a non object JSON body with 400', async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: ['qa@example.com'] });
    expect(response.status()).toBe(400);
  });
});

test.describe('Task API', () => {
  test('health endpoint returns UP', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'UP', service: 'taskboard-demo' });
  });

  test('tasks endpoint rejects unauthenticated requests', async ({ request }) => {
    expect((await request.get('/api/tasks')).status()).toBe(401);
  });

  test('tasks endpoint rejects an invalid token', async ({ request }) => {
    const response = await request.get('/api/tasks', { headers: bearer('not-a-real-token') });
    expect(response.status()).toBe(401);
  });

  test('list returns the contract shape including seeded tasks', async ({ request, apiToken }) => {
    const response = await request.get('/api/tasks', { headers: bearer(apiToken) });
    expect(response.status()).toBe(200);
    const { items } = (await response.json()) as { items: Task[] };
    for (const item of items) {
      expect(item).toEqual({ id: expect.any(Number), title: expect.any(String), completed: expect.any(Boolean) });
    }
    expect(items.map((t) => t.title)).toEqual(expect.arrayContaining(['Review regression suite', 'Validate API contract']));
  });

  test('authenticated user can create, update and delete a task', async ({ request, apiToken }) => {
    const headers = bearer(apiToken);
    const title = uniqueTitle('API lifecycle');
    const task = await createTask(request, apiToken, title);
    expect(task).toMatchObject({ title, completed: false });

    const updated = await request.patch(`/api/tasks/${task.id}`, { headers, data: { completed: true } });
    expect(updated.status()).toBe(200);
    expect((await updated.json()).completed).toBe(true);

    const deleted = await request.delete(`/api/tasks/${task.id}`, { headers });
    expect(deleted.status()).toBe(204);

    const list = (await (await request.get('/api/tasks', { headers })).json()).items as Task[];
    expect(list.find((t) => t.id === task.id)).toBeUndefined();
  });

  test('title is trimmed before it is stored', async ({ request, apiToken }) => {
    const title = uniqueTitle('Trim me');
    const task = await createTask(request, apiToken, `   ${title}   `);
    expect(task.title).toBe(title);
  });

  test('accepts an 80 character title and rejects 81', async ({ request, apiToken }) => {
    const headers = bearer(apiToken);
    const ok = await request.post('/api/tasks', { headers, data: { title: 'x'.repeat(80) } });
    expect(ok.status()).toBe(201);
    const tooLong = await request.post('/api/tasks', { headers, data: { title: 'x'.repeat(81) } });
    expect(tooLong.status()).toBe(400);
    expect(await tooLong.json()).toEqual({ error: 'title must be 80 characters or fewer' });
  });

  test('rejects blank and missing titles', async ({ request, apiToken }) => {
    const headers = bearer(apiToken);
    expect((await request.post('/api/tasks', { headers, data: { title: '   ' } })).status()).toBe(400);
    expect((await request.post('/api/tasks', { headers, data: {} })).status()).toBe(400);
  });

  test('PATCH validates that completed is boolean', async ({ request, apiToken }) => {
    const task = await createTask(request, apiToken, uniqueTitle('Patch validation'));
    const response = await request.patch(`/api/tasks/${task.id}`, { headers: bearer(apiToken), data: { completed: 'yes' } });
    expect(response.status()).toBe(400);
  });

  test('returns 404 when updating or deleting a missing task', async ({ request, apiToken }) => {
    const headers = bearer(apiToken);
    expect((await request.patch('/api/tasks/999999', { headers, data: { completed: true } })).status()).toBe(404);
    expect((await request.delete('/api/tasks/999999', { headers })).status()).toBe(404);
  });

  test('mutating endpoints require authentication', async ({ request }) => {
    expect((await request.post('/api/tasks', { data: { title: 'no auth' } })).status()).toBe(401);
    expect((await request.patch('/api/tasks/1', { data: { completed: true } })).status()).toBe(401);
    expect((await request.delete('/api/tasks/1')).status()).toBe(401);
  });
});
