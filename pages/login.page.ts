import { Page, Locator } from '@playwright/test';
import { CREDENTIALS } from '../utils/api';

export class LoginPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Sign in' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.error = page.locator('#login-error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string = CREDENTIALS.email, password: string = CREDENTIALS.password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
