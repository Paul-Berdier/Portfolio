import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const presentation = (page: Page) => page.locator('[data-brand-animation="presentation"]').first();
const progress = (controller: Locator) => controller.locator('input[data-brand-progress]');

async function openBrand(page: Page) {
  const response = await page.goto('/dev/brand');
  expect(response?.status()).toBe(200);
  const controller = presentation(page);
  await controller.scrollIntoViewIfNeeded();
  await expect(controller).toHaveAttribute('data-brand-ready', 'true');
  return controller;
}

async function seek(controller: Locator, value: number) {
  await controller.locator('[data-brand-action="pause"]').click();
  await progress(controller).evaluate((element, next) => {
    (element as HTMLInputElement).value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await expect
    .poll(async () => Number(await progress(controller).inputValue()))
    .toBeCloseTo(value, 3);
}

async function normalizedPaths(controller: Locator) {
  return controller
    .locator('[data-brand-art] [data-ribbon-shape]')
    .evaluateAll((paths) =>
      paths.map((path) => (path.getAttribute('d') || '').replace(/\s+/g, ' ').trim()),
    );
}

test.describe('Identité MorphAI et contrôleur du ruban', () => {
  test('la page de contrôle reste non indexée et hors navigation commerciale', async ({
    page,
    request,
  }) => {
    await openBrand(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/dev/brand');
    await page.goto('/');
    await expect(
      page.locator('header a[href="/dev/brand"], footer a[href="/dev/brand"]'),
    ).toHaveCount(0);
    await expect(page.locator('.brand [data-ribbon-shape]')).not.toHaveCount(0);
    await expect(page.locator('.brand .mark-piece')).toHaveCount(0);
  });

  test('les SVG multiples possèdent des identifiants uniques et des références locales valides', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openBrand(page);
    const result = await page.evaluate(() => {
      // querySelectorAll déduplique les nœuds, y compris dans les SVG imbriqués.
      // Les fragments SVG référencent les identifiants à l'échelle du document.
      const ids = Array.from(document.querySelectorAll('svg[id], svg [id]'), (node) => node.id);
      const missing: string[] = [];
      for (const element of document.querySelectorAll('svg, svg *')) {
        for (const attribute of Array.from(element.attributes)) {
          for (const match of attribute.value.matchAll(/url\(['"]?#([^)'"\s]+)['"]?\)/g)) {
            if (!document.getElementById(match[1]!)) missing.push(match[1]!);
          }
        }
      }
      return { ids, missing, embeddedRaster: !!document.querySelector('svg image') };
    });
    expect(result.ids.length).toBeGreaterThan(3);
    expect(new Set(result.ids).size).toBe(result.ids.length);
    expect(result.missing).toEqual([]);
    expect(result.embeddedRaster).toBe(false);
  });

  test('lecture, pause et replay pilotent réellement la progression', async ({ page }) => {
    const controller = await openBrand(page);
    await seek(controller, 0.2);
    await expect(controller).toHaveAttribute('data-brand-state', 'paused');
    const paused = await progress(controller).inputValue();
    await page.waitForTimeout(250);
    await expect(progress(controller)).toHaveValue(paused);
    await controller.locator('[data-brand-action="play"]').click();
    await expect
      .poll(async () => Number(await progress(controller).inputValue()))
      .toBeGreaterThan(0.2);
    await expect(controller).toHaveAttribute('data-brand-state', 'complete');
    await expect(progress(controller)).toHaveValue('1');
    await controller.locator('[data-brand-action="replay"]').click();
    await expect
      .poll(async () => Number(await progress(controller).inputValue()))
      .toBeLessThan(0.5);
    await expect(controller).toHaveAttribute('data-brand-state', 'playing');
  });

  test('la même progression reproduit les mêmes tracés et le dernier état rejoint le logo canonique', async ({
    page,
  }) => {
    const controller = await openBrand(page);
    await seek(controller, 0.45);
    const middle = await normalizedPaths(controller);
    expect(middle.length).toBeGreaterThan(0);
    await seek(controller, 1);
    const final = await normalizedPaths(controller);
    expect(final).not.toEqual(middle);
    const target = (await page.locator('.brand [data-ribbon-shape]').first().getAttribute('d'))!
      .replace(/\s+/g, ' ')
      .trim();
    expect(final.every((path) => path === target)).toBe(true);
    await seek(controller, 0.45);
    expect(await normalizedPaths(controller)).toEqual(middle);
  });

  test('trois replays conservent un seul contrôleur et un nombre stable de canvas', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const controller = await openBrand(page);
    const canvases = await page.locator('canvas').count();
    for (let index = 0; index < 3; index++) {
      await controller.locator('[data-brand-action="replay"]').click();
      await seek(controller, 0.5);
      await expect(page.locator('[data-brand-animation="presentation"]')).toHaveCount(1);
      await expect(page.locator('canvas')).toHaveCount(canvases);
    }
    expect(errors).toEqual([]);
  });

  test('le passage réduit pendant la transformation présente immédiatement la forme finale', async ({
    page,
  }) => {
    const controller = await openBrand(page);
    await seek(controller, 0.35);
    await controller.locator('[data-brand-action="play"]').click();
    await page.locator('#motion-preference').selectOption('reduced');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(progress(controller)).toHaveValue('1');
    await expect(controller.locator('[data-brand-art]')).toBeVisible();
    const target = (await page.locator('.brand [data-ribbon-shape]').first().getAttribute('d'))!
      .replace(/\s+/g, ' ')
      .trim();
    expect((await normalizedPaths(controller)).every((path) => path === target)).toBe(true);
  });

  test('le mode désactivé conserve un logo stable et ne laisse aucune animation CSS active', async ({
    page,
  }) => {
    const controller = await openBrand(page);
    await page.locator('#motion-preference').selectOption('off');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(progress(controller)).toHaveValue('1');
    await controller.scrollIntoViewIfNeeded();
    const first = await controller.locator('[data-brand-art]').innerHTML();
    await page.waitForTimeout(350);
    expect(await controller.locator('[data-brand-art]').innerHTML()).toBe(first);
    expect(
      await controller.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      ),
    ).toBe(0);
    await expect(page.locator('.morph-engine canvas')).toHaveCount(0);
  });

  test('un stockage local indisponible ne bloque pas le choix de mouvement dans la session', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      for (const name of ['getItem', 'setItem'])
        Object.defineProperty(Storage.prototype, name, {
          value: () => {
            throw new DOMException('Storage unavailable', 'SecurityError');
          },
          configurable: true,
        });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('.brand [data-ribbon-shape]')).not.toHaveCount(0);
    await page.locator('#motion-preference').selectOption('reduced');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('.morph-engine .engine-fallback')).toHaveCSS('opacity', '1');
    expect(errors).toEqual([]);
  });

  test('une modification système applique le repli puis permet le retour automatique', async ({
    page,
  }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('.morph-engine canvas')).toHaveCount(0);
    await expect(page.locator('.morph-engine .engine-fallback')).toHaveCSS('opacity', '1');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'auto');
    await expect(page.locator('.morph-engine canvas')).toHaveCount(1);
  });

  test('la progression s’arrête lorsque la scène sort de l’écran puis reprend à son retour', async ({
    page,
  }) => {
    const controller = await openBrand(page);
    await seek(controller, 0.15);
    await controller.locator('[data-brand-action="play"]').click();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(controller).not.toBeInViewport();
    await page.waitForTimeout(100);
    const frozen = await progress(controller).inputValue();
    await page.waitForTimeout(300);
    await expect(progress(controller)).toHaveValue(frozen);
    await controller.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => Number(await progress(controller).inputValue()))
      .toBeGreaterThan(Number(frozen));
  });

  test('un événement de visibilité masquée simulé suspend le contrôleur', async ({ page }) => {
    const controller = await openBrand(page);
    await seek(controller, 0.15);
    await controller.locator('[data-brand-action="play"]').click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const frozen = await progress(controller).inputValue();
    await page.waitForTimeout(300);
    await expect(progress(controller)).toHaveValue(frozen);
    await page.evaluate(() => {
      Reflect.deleteProperty(document, 'hidden');
      Reflect.deleteProperty(document, 'visibilityState');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect
      .poll(async () => Number(await progress(controller).inputValue()))
      .toBeGreaterThan(Number(frozen));
  });

  test('une perte réelle de contexte WebGL rétablit le logo SVG', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.morph-engine canvas');
    await expect(canvas).toHaveCount(1);
    const lost = await canvas.evaluate((element) => {
      const context = (element as HTMLCanvasElement).getContext('webgl2');
      const extension = context?.getExtension('WEBGL_lose_context');
      extension?.loseContext();
      return !!extension;
    });
    test.skip(!lost, 'Extension de simulation de perte WebGL indisponible dans ce navigateur');
    await expect(page.locator('.morph-engine .engine-fallback')).toHaveCSS('opacity', '1');
    await expect(page.locator('.morph-engine [data-engine-mode="brand"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('main a[href="/contact"]').first()).toBeVisible();
  });

  test('un service reste accessible pendant l’introduction et un chargement Three retardé', async ({
    page,
  }) => {
    let release!: () => void;
    let held = 0;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'script' && /\/engine\./.test(route.request().url())) {
        held++;
        await gate;
      }
      await route.continue();
    });
    try {
      // Un module retenu peut lui-même empêcher DOMContentLoaded en développement.
      await page.goto('/', { waitUntil: 'commit' });
      await expect.poll(() => held).toBeGreaterThan(0);
      await expect(page.locator('main h1')).toBeVisible();
      await page.locator('.desktop-nav a[href="/services"]').click();
      await expect(page).toHaveURL(/\/services$/);
      release();
      await page.unrouteAll({ behavior: 'wait' });
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('canvas')).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally {
      release();
    }
  });

  test('le logo complet est présent sur mobile sans JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    try {
      await page.goto('/');
      await expect(page.locator('.brand')).toBeVisible();
      await expect(page.locator('.brand')).toHaveAccessibleName(/MorphAI/);
      await expect(page.locator('.brand [data-ribbon-shape]').first()).toBeVisible();
      await expect(page.locator('.morph-engine .engine-fallback')).toHaveCSS('opacity', '1');
      await page.locator('.desktop-nav a[href="/services"]').click();
      await expect(page).toHaveURL(/\/services$/);
    } finally {
      await context.close();
    }
  });

  for (const width of [360, 390, 768, 1440, 1920]) {
    test(`identité lisible et page de contrôle sans débordement à ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openBrand(page);
      await expect(page.locator('.brand')).toHaveAccessibleName(/MorphAI/);
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
    });
  }

  test('la page de marque respecte les règles axe WCAG A/AA testées', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openBrand(page);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    await testInfo.attach('axe-brand', {
      body: JSON.stringify(result.violations, null, 2),
      contentType: 'application/json',
    });
    expect(result.violations).toEqual([]);
  });
});
