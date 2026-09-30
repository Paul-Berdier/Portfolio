import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Playwright crée un profil temporaire isolé, même avec le Chrome déjà installé.
const channel = process.env.PLAYWRIGHT_CHANNEL ||
  (process.platform === 'win32' && existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') ? 'chrome' : undefined);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321';
const serverCommand = process.env.PLAYWRIGHT_SERVER_COMMAND || 'node node_modules/astro/bin/astro.mjs dev --host 127.0.0.1 --port 4321';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results/playwright',
  use: {
    baseURL,
    locale: 'fr-FR',
    reducedMotion: 'no-preference',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel } }],
  webServer: {
    command: serverCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PUBLIC_SITE_MODE: 'preview',
      PUBLIC_LEGAL_VALIDATED: 'false',
      CONTACT_ENABLED: 'false',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
  },
});
