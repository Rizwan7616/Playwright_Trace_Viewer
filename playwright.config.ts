import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [
    [isCI ? 'github' : 'list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Open any failure with: npx playwright show-trace <path>/trace.zip
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },

  // Starts the demo app automatically; reuses it if already running locally.
  webServer: {
    command: 'node server/server.js',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 30_000,
    env: { PORT: String(PORT) }
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
