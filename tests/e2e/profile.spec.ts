import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { locale: 'fr', about: '/a-propos', work: '/realisations', home: '/', title: /À propos/, keywords: /Compétences & outils/ },
  { locale: 'en', about: '/en/about', work: '/en/work', home: '/en', title: /About/, keywords: /Skills & tools/ },
  { locale: 'es', about: '/es/sobre-mi', work: '/es/proyectos', home: '/es', title: /Sobre/, keywords: /Competencias y herramientas/ },
] as const;
for (const entry of pages) {
  for (const width of [390, 1440]) {
    test(`profile and real project cards: ${entry.locale}, ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(entry.about);
      await expect(page).toHaveTitle(entry.title);
      await expect(page.locator('html')).toHaveAttribute('lang', entry.locale);
      await expect(page.locator('main')).toContainText('Prooftag');
      await expect(page.locator('main')).toContainText('Bac+5');
      await expect(page.locator('#skills')).toContainText(entry.keywords);
      await expect(page.locator('.skill-group')).toHaveCount(6);
      await expect(page.locator('main a[href="https://github.com/Paul-Berdier"]')).toBeVisible();
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`about-${entry.locale}-${width}.png`), fullPage: true });
      await page.goto(entry.work);
      const projects = page.locator('[data-selected-project]');
      await expect(projects).toHaveCount(3);
      for (const id of ['missionpilot', 'plumid', 'toile-dor']) {
        const project = page.locator(`#${id}`);
        await project.locator('summary').click();
        await expect(project.locator('details')).toHaveAttribute('open', '');
        await expect(project.locator('.selected-links a').first()).toHaveAttribute('href', /^https:\/\/github.com\/Paul-Berdier\//);
      }
      await expect(page.locator('[data-project-item]')).toHaveCount(2);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`projects-${entry.locale}-${width}.png`), fullPage: true });
      await page.goto(entry.home);
      await expect(page.locator('[data-selected-project]')).toHaveCount(3);
      const button = page.locator('.hero-actions .button');
      expect(await button.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
      expect(await page.locator('.hero-description').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
      expect(await page.locator('.method-steps p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
      await page.screenshot({ path: testInfo.outputPath(`home-${entry.locale}-${width}.png`), fullPage: true });
    });
  }
}
test('language links track a changed section anchor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/realisations');
  await page.evaluate(() => { location.hash = 'plumid'; });
  const spanish = page.locator('[data-language-switcher] a[data-language="es"]');
  await expect(spanish).toHaveAttribute('href', /\/es\/proyectos#plumid$/);
  await spanish.click();
  await expect(page).toHaveURL(/\/es\/proyectos#plumid$/);
  await expect(page.locator('#plumid')).toContainText('Plum’ID');
});
