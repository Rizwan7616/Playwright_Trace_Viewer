import { Page, Locator } from '@playwright/test';

export class TasksPage {
  readonly heading: Locator;
  readonly welcome: Locator;
  readonly taskInput: Locator;
  readonly addButton: Locator;
  readonly signOutButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My tasks' });
    this.welcome = page.locator('#welcome');
    this.taskInput = page.getByPlaceholder('Add a task...');
    this.addButton = page.getByRole('button', { name: 'Add task' });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
    this.error = page.locator('#task-error');
  }

  async addTask(title: string) {
    await this.taskInput.fill(title);
    await this.addButton.click();
  }

  taskByTitle(title: string): Locator {
    return this.page.locator('#task-list > li').filter({ hasText: title });
  }

  async complete(title: string) {
    await this.taskByTitle(title).getByRole('checkbox').check();
  }

  async remove(title: string) {
    await this.taskByTitle(title).getByRole('button', { name: 'Delete' }).click();
  }
}
