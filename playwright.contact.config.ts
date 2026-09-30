import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const channel = process.env.PLAYWRIGHT_CHANNEL ||
  (process.platform === 'win32' && existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') ? 'chrome' : undefined);
const baseURL = 'http://127.0.0.1:4323';

export default defineConfig({
  testDir: './tests/e2e-contact',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: 'test-results/contact',
  use: {
    baseURL, locale: 'fr-FR', reducedMotion: 'reduce',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  projects: [{ name: 'contact-chromium', use: { ...devices['Desktop Chrome'], channel } }],
  webServer: {
    // Option Astro 7 documentée : instance indépendante sans arrêter celle de Paul.
    command: 'node node_modules/astro/bin/astro.mjs dev --host 127.0.0.1 --port 4323 --ignore-lock',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    // Configuration de TEST uniquement, sur loopback. Aucun service réel,
    // aucun contournement de validation dans le code applicatif.
    env: {
      ASTRO_TELEMETRY_DISABLED: '1',
      PUBLIC_SITE_MODE: 'production', PUBLIC_LEGAL_VALIDATED: 'true', PUBLIC_SITE_URL: '',
      CONTACT_ENABLED: 'true', CONTACT_ALLOWED_ORIGINS: baseURL,
      CONTACT_HASH_SECRET: 'synthetic-browser-tests-only-not-a-production-secret',
      CONTACT_TRUSTED_PROXY_HOPS: '0', CONTACT_DB_SSL: 'false',
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
      RESEND_API_KEY: '', CONTACT_FROM_EMAIL: '', CONTACT_TO_EMAIL: '',
    },
  },
});
