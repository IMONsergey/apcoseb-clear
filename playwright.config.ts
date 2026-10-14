import { defineConfig } from '@playwright/test';
import { releaseSuites } from './playwright.suites';
const previewPath = process.env.APCO_TEST_BASE_PATH || '/apcoseb-clear/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(previewPath)) {
  throw new Error('APCO_TEST_BASE_PATH must be a directory path such as /site/ or /.');
}
const previewPort = Number(process.env.APCO_TEST_PORT || '4187');
if (!Number.isInteger(previewPort) || previewPort < 1 || previewPort > 65535) {
  throw new Error('APCO_TEST_PORT must be an integer between 1 and 65535.');
}
const previewUrl = `http://127.0.0.1:${previewPort}${previewPath}`;
const browserExecutables = {
  chromium: process.env.APCO_CHROMIUM_EXECUTABLE,
  firefox: process.env.APCO_FIREFOX_EXECUTABLE,
  webkit: process.env.APCO_WEBKIT_EXECUTABLE,
};
export default defineConfig({
  testDir: './tests',
  testMatch: releaseSuites,
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.APCO_BASE_URL || previewUrl,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: (['chromium', 'firefox', 'webkit'] as const).map((browserName) => ({
    name: browserName,
    use: {
      browserName,
      ...(browserExecutables[browserName]
        ? {
            launchOptions: {
              executablePath: browserExecutables[browserName],
              ...(browserName === 'chromium'
                ? { args: ['--no-sandbox', '--disable-dev-shm-usage'] }
                : {}),
            },
          }
        : {}),
    },
  })),
  ...(process.env.APCO_BASE_URL
    ? {}
    : {
        webServer: {
          command: `npm run preview -- --base=${previewPath} --port=${previewPort}`,
          url: previewUrl,
          reuseExistingServer: false,
          timeout: 30000,
        },
      }),
});
