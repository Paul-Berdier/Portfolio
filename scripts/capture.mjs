import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const channel =
  process.env.PLAYWRIGHT_CHANNEL ||
  (process.platform === 'win32' &&
  existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
    ? 'chrome'
    : undefined);
mkdirSync('test-results/review', { recursive: true });
const browser = await chromium.launch({ channel });
try {
  for (const width of [360, 390, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: width < 760 ? 844 : 1000 },
      reducedMotion: 'reduce',
      locale: 'fr-FR',
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: `test-results/review/home-reduced-${width}.png`,
      fullPage: true,
    });
    console.log(
      JSON.stringify({
        width,
        motion: 'reduced',
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      }),
    );
    await page.close();
  }
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: width < 760 ? 844 : 1000 },
      reducedMotion: 'no-preference',
      locale: 'fr-FR',
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('[data-engine][data-ready="true"]').waitFor();
    // Wait for the finite assembly before capturing the genuinely running scene.
    await page.waitForTimeout(2100);
    await page.screenshot({ path: `test-results/review/home-active-${width}.png` });
    if (width === 1440)
      for (const mode of ['automation', 'data', 'ai']) {
        await page.locator(`[data-engine-mode="${mode}"]`).click();
        await page.waitForTimeout(2100);
        await page.screenshot({ path: `test-results/review/engine-${mode}.png` });
      }
    await page.close();
  }
} finally {
  await browser.close();
}
