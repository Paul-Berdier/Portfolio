import { test, expect } from '@playwright/test';

for (const width of [768, 820, 1024]) {
  for (const path of ['/', '/en', '/es']) {
    test(`aurora stays inside its column at ${width}px: ${path}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      const scene = page.locator('.morph-engine[data-engine]');
      const aurora = scene.locator('[data-aurora]');
      await scene.scrollIntoViewIfNeeded();
      await expect(aurora).toHaveAttribute('data-aurora-state', 'running');
      const bounds = await aurora.evaluate((element) => {
        const parent = element.closest('[data-brand-stage]')!.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return { left: box.left - parent.left, right: box.right - parent.right };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(-1);
      expect(bounds.right).toBeLessThanOrEqual(1);
      const checkWidth = async () => {
        const size = await page.evaluate(() => ({
          viewport: innerWidth,
          content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        }));
        expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      };
      await checkWidth();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(aurora).toHaveAttribute('data-aurora-state', 'reduced');
      await checkWidth();
      if (width === 768 && path === '/') {
        await testInfo.attach('aurora-tablet-768', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });
  }
}
