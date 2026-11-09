import { APIRequestContext, expect } from '@playwright/test';

export const CREDENTIALS = { email: 'qa@example.com', password: 'Password123!' } as const;

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

/** Logs in through the API and returns the bearer token. */
export async function loginViaApi(request: APIRequestContext): Promise<string> {
  const response = await request.post('/api/auth/login', { data: CREDENTIALS });
  expect(response.status(), 'login should succeed').toBe(200);
  const body = await response.json();
  return body.accessToken as string;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function createTask(request: APIRequestContext, token: string, title: string): Promise<Task> {
  const response = await request.post('/api/tasks', { headers: bearer(token), data: { title } });
  expect(response.status(), 'task creation should return 201').toBe(201);
  return (await response.json()) as Task;
}

/** Unique, human readable title so parallel tests never collide. */
export const uniqueTitle = (prefix: string) => `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
