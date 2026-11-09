# Playwright + TypeScript QA Automation Framework

End to end test automation for a small full stack demo app (**TaskBoard**), covering UI, API and hybrid API+UI testing with Playwright and TypeScript. Runs on Chromium, Firefox and WebKit, in parallel, in GitHub Actions, and every failure ships with a **Playwright Trace Viewer** recording.

## What is covered

| Layer | Tests | Examples |
|---|---|---|
| UI (`tests/ui`) | 14 | login success/failure, error recovery, sign out, session restore on reload, add/complete/delete task, persistence, client and server validation, 80 char limit |
| API (`tests/api`) | 16 | auth contract, 401 for missing/invalid tokens, CRUD lifecycle, payload trimming, boundary values (80/81 chars), 400/404 handling, malformed JSON |
| Hybrid (`tests/hybrid`) | 4 | seed data through the API and assert in the UI; act in the UI and assert in the API; tampered token falls back to login |

34 tests per browser, 102 across the three browsers.

## Engineering practices shown

- **Page Object Model** (`pages/`) with role/label based locators, no CSS chains or sleeps.
- **Custom fixtures** (`fixtures/`): page objects, an API token fixture, and a `signedInPage` fixture that skips the UI login by injecting a session token, which makes UI tests faster and more focused.
- **Test isolation:** every test creates uniquely named data, so tests run fully parallel without ordering dependencies.
- **Web first assertions** with auto waiting, and `expect.poll` for eventual consistency.
- **Diagnostics:** trace, screenshot and video on failure, HTML report, JUnit XML.
- **CI:** type check job, then a Chromium / Firefox / WebKit matrix; reports and traces uploaded as artifacts even when tests fail.
- **Zero dependency demo server** (`server/server.js`, Node built-ins only): no install step, no version drift, started automatically by Playwright's `webServer`.

## Run locally

Requirements: Node.js 20+.

```bash
npm install
npx playwright install
npm test                 # all tests, all browsers
npm run test:ui          # UI only, Chromium
npm run test:api         # API only, Chromium
npm run test:hybrid      # hybrid only, Chromium
npm run test:headed      # watch the browser
npm run test:debug       # Playwright Inspector
npm run typecheck
npm run report           # open the HTML report
```

Playwright starts the demo app on `http://127.0.0.1:4173` by itself. To run it manually: `npm run start:app`.

After the first `npm install`, commit the generated `package-lock.json` so CI installs are reproducible.

## Debugging with the Trace Viewer

Traces are recorded when a test fails (and on first retry in CI).

```bash
npm run trace -- test-results/<failed-test-folder>/trace.zip
```

The viewer shows a timeline with DOM snapshots before and after every action, network calls, console output and the exact locator used. In CI, download the `playwright-traces-<browser>` artifact and open the same file locally. To record a trace for a passing run: `npx playwright test --trace on`.

## Demo application

`server/` contains a tiny TaskBoard app (static front end plus JSON API). It uses a fixed demo token and in memory data that resets on restart. It is a test target, not an example of production authentication.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/login` | `qa@example.com` / `Password123!` |
| GET | `/api/me` | current user |
| GET, POST | `/api/tasks` | title required, max 80 chars, trimmed |
| PATCH, DELETE | `/api/tasks/:id` | `completed` must be boolean; 404 when missing |

## Project structure

```text
.
├── .github/workflows/playwright.yml
├── fixtures/test-fixtures.ts
├── pages/                 login.page.ts, tasks.page.ts
├── utils/api.ts           API helpers and test data
├── server/                demo app (server.js + public/)
├── tests/
│   ├── ui/
│   ├── api/
│   └── hybrid/
├── playwright.config.ts
└── tsconfig.json
```
