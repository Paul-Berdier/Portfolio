import { test, expect, type Page } from '@playwright/test';

async function openAurora(page: Page, path = '/') {
  await page.goto(path);
  const scene = page.locator('.morph-engine[data-engine]');
  await scene.scrollIntoViewIfNeeded();
  const aurora = scene.locator('[data-aurora]');
  await expect(aurora).toHaveAttribute('data-aurora-ready', 'true');
  await expect(scene.locator('[data-brand-animation]')).toHaveAttribute('data-brand-state', 'complete');
  await expect(aurora).toHaveAttribute('data-aurora-state', 'running');
  return { scene, aurora, veil: aurora.locator('[data-aurora-veil="0"]') };
}

for (const [path, label] of [['/', 'Mettre l’aurore en pause'], ['/en', 'Pause the aurora'], ['/es', 'Pausar la aurora']] as const) {
  test(`aurora is alive but the settled M stays stable: ${path}`, async ({ page }, testInfo) => {
    const { scene, veil } = await openAurora(page, path);
    const logo = scene.locator('[data-ribbon-shape]').first();
    const stablePath = await logo.getAttribute('d');
    const frame = await veil.getAttribute('d');
    await expect.poll(() => veil.getAttribute('d')).not.toBe(frame);
    await expect(logo).toHaveAttribute('d', stablePath!);
    await expect(scene).toHaveAttribute('data-state', 'brand');
    await expect(scene.getByRole('button', { name: label })).toBeVisible();
    await expect(page.locator('[data-aurora]')).toHaveCount(1);
    expect(await scene.locator('canvas').count()).toBeLessThanOrEqual(1);
    await testInfo.attach('aurora-active', { body: await scene.screenshot(), contentType: 'image/png' });
  });
}

test('the local pause button freezes actual paths, then resumes', async ({ page }) => {
  const { scene, aurora, veil } = await openAurora(page);
  const pause = scene.locator('[data-aurora-toggle]');
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(aurora).toHaveAttribute('data-aurora-state', 'paused');
  const frozen = await veil.getAttribute('d');
  await page.waitForTimeout(500);
  expect(await veil.getAttribute('d')).toBe(frozen);
  await pause.click();
  await expect(aurora).toHaveAttribute('data-aurora-state', 'running');
  await expect.poll(() => veil.getAttribute('d')).not.toBe(frozen);
});

test('ambience pauses off screen and in the service views', async ({ page }) => {
  const { scene, aurora, veil } = await openAurora(page);
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(aurora).toHaveAttribute('data-aurora-state', 'paused');
  const frozen = await veil.getAttribute('d');
  await page.waitForTimeout(400);
  expect(await veil.getAttribute('d')).toBe(frozen);
  await scene.scrollIntoViewIfNeeded();
  await expect(aurora).toHaveAttribute('data-aurora-state', 'running');
  await scene.locator('[data-engine-mode="data"]').click();
  await expect(aurora).toHaveAttribute('data-aurora-state', 'paused');
  await expect(aurora).toBeHidden();
  await scene.locator('[data-engine-mode="brand"]').click();
  await expect(aurora).toHaveAttribute('data-aurora-state', 'running');
});

test('reduced motion and off never leave an ambient loop', async ({ page }) => {
  await openAurora(page);
  await page.locator('#motion-preference').selectOption('off');
  const aurora = page.locator('[data-aurora]');
  await expect(aurora).toHaveAttribute('data-aurora-state', 'off');
  await expect(aurora).toBeHidden();
  await expect(page.locator('[data-aurora-toggle]')).toBeHidden();
  const path = await aurora.locator('[data-aurora-veil="0"]').getAttribute('d');
  await page.waitForTimeout(350);
  expect(await aurora.locator('[data-aurora-veil="0"]').getAttribute('d')).toBe(path);
  await page.locator('#motion-preference').selectOption('auto');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.morph-engine').scrollIntoViewIfNeeded();
  await expect(aurora).toHaveAttribute('data-aurora-state', 'reduced');
  await expect(page.locator('[data-aurora-toggle]')).toBeHidden();
  await expect(page.locator('.aurora-dust')).toBeHidden();
});

test('the mobile scene remains readable without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { scene } = await openAurora(page, '/es');
  await expect(scene.locator('[data-aurora-particle]:visible')).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const button of await scene.locator('[data-engine-mode]').all()) {
    expect(await button.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(12);
  }
  await testInfo.attach('aurora-mobile-es', { body: await scene.screenshot(), contentType: 'image/png' });
});

test('language navigation remounts a single ambience and keeps the profile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openAurora(page);
  for (const path of ['/en', '/es', '/']) {
    await page.locator(`a[href="${path}"][hreflang]`).first().click();
    await expect(page.locator('[data-aurora]')).toHaveCount(1);
    await expect(page.locator('[data-aurora]')).toHaveAttribute('data-aurora-ready', 'true');
  }
  await page.goto('/en/about');
  await expect(page.locator('main')).toContainText('Prooftag');
  await expect(page.locator('main a[href="https://github.com/Paul-Berdier"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('without JavaScript the logo is present and no dead pause control appears', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[data-brand-art]').first()).toBeVisible();
    await expect(page.locator('[data-aurora-toggle]')).toBeHidden();
    await expect(page.locator('[data-aurora]')).toHaveAttribute('data-aurora-state', 'static');
  } finally {
    await context.close();
  }
});
