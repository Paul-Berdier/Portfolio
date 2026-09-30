import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const editorialRoutes = [
  '/',
  '/services',
  '/services/developpement-web',
  '/services/automatisation',
  '/services/data',
  '/services/intelligence-artificielle',
  '/realisations',
  '/realisations/flux-documents',
  '/realisations/atelier-data',
  '/a-propos',
  '/contact',
  '/lab',
  '/mentions-legales',
  '/confidentialite',
];
const draftRoute = '/realisations/recherche-documentaire';

async function openPage(page: Page, path = '/') {
  const response = await page.goto(path);
  expect(response?.status(), `${path} doit répondre sans erreur`).toBe(200);
  await expect(page.locator('main h1')).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.content, 'Aucun contenu ne doit dépasser horizontalement').toBeLessThanOrEqual(
    dimensions.viewport + 1,
  );
}

test.describe('Pages publiques et intégrité du contenu', () => {
  for (const path of editorialRoutes) {
    test(`route éditoriale ${path}`, async ({ page }) => {
      await openPage(page, path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/\S.+/);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.trim().length).toBeGreaterThan(10);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.getByRole('link', { name: 'Aller au contenu' })).toHaveAttribute(
        'href',
        '#main',
      );
    });
  }

  test('404 réelle et brouillon inaccessible', async ({ page, request }) => {
    const response = await page.goto('/une-route-qui-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.locator('main h1')).toBeVisible();
    expect((await request.get(draftRoute)).status()).toBe(404);
    await openPage(page, '/realisations');
    await expect(page.locator(`a[href="${draftRoute}"]`)).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('Brouillon non publié');
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.join('\n')).not.toContain('recherche-documentaire');
  });

  test('les liens internes des pages principales répondent', async ({ page, request }) => {
    const links = new Set<string>();
    for (const path of ['/', '/services', '/realisations', '/a-propos', '/lab', '/contact']) {
      await openPage(page, path);
      const hrefs = await page
        .locator('a[href]')
        .evaluateAll((anchors) =>
          anchors
            .map((anchor) => anchor.getAttribute('href') || '')
            .filter((href) => href.startsWith('/') && !href.startsWith('//')),
        );
      hrefs.forEach((href) => links.add(href.split('#')[0] || '/'));
    }
    expect(links.size).toBeGreaterThan(10);
    for (const href of links) {
      expect((await request.get(href)).status(), `Lien interne ${href}`).toBeLessThan(400);
    }
  });

  test('sitemap sans brouillon et robots de préproduction', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/Disallow:\s*\//i);
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).not.toContain('recherche-documentaire');
  });
});

test.describe('Navigation et clavier', () => {
  test('menu mobile, Escape et restitution du focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page);
    const toggle = page.locator('.menu-toggle');
    const menu = page.locator('dialog#mobile-menu');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await menu.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await toggle.press('Enter');
    await menu.getByRole('link', { name: /Expertises/ }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('dialog#mobile-menu')).not.toBeVisible();
  });

  test('lien d’évitement accessible au clavier', async ({ page }) => {
    await openPage(page);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});

test.describe('Mouvement et scène signature', () => {
  test('le choix suit le système dès le chargement', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPage(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('#motion-preference')).toHaveValue('auto');
    await expect(page.locator('[data-engine] .engine-fallback')).toBeVisible();
    await expect(page.locator('[data-engine] .engine-fallback')).toHaveCSS('opacity', '1');
  });

  test('auto, réduit et désactivé persistent après navigation et rechargement', async ({
    page,
  }) => {
    await openPage(page);
    for (const mode of ['reduced', 'off', 'auto']) {
      await page.locator('#motion-preference').selectOption(mode);
      await expect(page.locator('html')).toHaveAttribute('data-motion', mode);
      if (mode !== 'auto') {
        await expect(page.locator('[data-engine] .engine-fallback')).toHaveCSS('opacity', '1');
        await expect(page.locator('[data-engine] canvas')).toHaveCount(0);
      }
      await page.locator('.brand').click();
      await expect(page.locator('#motion-preference')).toHaveValue(mode);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-motion', mode);
      await expect(page.locator('#motion-preference')).toHaveValue(mode);
    }
  });

  test('le logo et les quatre expertises sont commandables au clavier', async ({ page }) => {
    await openPage(page);
    const engine = page.locator('.morph-engine[data-engine]');
    await expect(engine).toHaveAttribute('data-state', 'brand');
    await expect(engine.locator('button[data-engine-mode="brand"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const mode of ['web', 'automation', 'data', 'ai', 'brand']) {
      const button = engine.locator(`button[data-engine-mode="${mode}"]`);
      await button.focus();
      await button.press('Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(engine.locator('button[aria-pressed="true"]')).toHaveCount(1);
      await expect(engine.locator('[data-engine-caption]')).not.toBeEmpty();
      await expect(engine.locator('[data-engine-caption]')).not.toContainText('undefined');
      await expect(engine).toHaveAttribute('data-state', mode);
    }
  });

  test('un titre hors écran se révèle à son entrée puis retrouve son HTML en mode réduit', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openPage(page);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const title = page.locator('h2#transformation-title[data-reveal]');
    await expect(title).not.toBeInViewport();
    await expect(title.locator('div')).toHaveCount(0);
    const originalMarkup = await title.innerHTML();
    const originalText = (await title.textContent())!.replace(/\s+/g, '');
    expect(originalText.length).toBeGreaterThan(10);
    await expect(title).toHaveCSS('opacity', '1');

    await title.scrollIntoViewIfNeeded();
    await expect(title).toBeInViewport();
    // SplitText crée les lignes et leurs masques seulement à la première entrée.
    const lines = title.locator(':scope > div > div');
    await expect.poll(() => lines.count()).toBeGreaterThan(0);
    await expect
      .poll(
        async () =>
          lines.evaluateAll((elements) =>
            elements.every((element) => {
              const style = getComputedStyle(element);
              const transform = new DOMMatrixReadOnly(
                style.transform === 'none' ? undefined : style.transform,
              );
              return Number(style.opacity) === 1 && Math.abs(transform.m42) < 0.5;
            }),
          ),
        { message: 'Les lignes doivent être revenues dans leur masque après la révélation' },
      )
      .toBe(true);
    expect((await title.textContent())!.replace(/\s+/g, '')).toBe(originalText);
    await expect(title).toBeVisible();

    await page.locator('#motion-preference').selectOption('reduced');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect.poll(() => title.innerHTML()).toBe(originalMarkup);
    await expect(title.locator('div')).toHaveCount(0);
    await title.scrollIntoViewIfNeeded();
    await expect(title).toBeInViewport();
    await expect(title).toHaveCSS('opacity', '1');
    expect((await title.textContent())!.replace(/\s+/g, '')).toBe(originalText);
  });

  test('le canvas est réellement actif en mode automatique', async ({ page }) => {
    await openPage(page);
    const canvas = page.locator('[data-engine] canvas');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toBeVisible();
    const firstFrame = await canvas.screenshot();
    await page.locator('button[data-engine-mode="data"]').click();
    await expect
      .poll(async () => (await canvas.screenshot()).equals(firstFrame), {
        message: 'La transformation doit produire un changement réellement rendu dans le canvas',
      })
      .toBe(false);
  });

  test('cinq navigations et retour navigateur ne dupliquent pas la scène', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openPage(page);
    for (let index = 0; index < 5; index++) {
      await page.locator('.desktop-nav a[href="/services"]').click();
      await expect(page).toHaveURL(/\/services$/);
      await page.locator('.brand').click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('[data-engine] canvas')).toHaveCount(1);
      await page.locator('button[data-engine-mode="automation"]').click();
      await expect(page.locator('button[data-engine-mode="automation"]')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    }
    await page.goBack();
    await expect(page).toHaveURL(/\/services$/);
    await page.goForward();
    await expect(page.locator('[data-engine] canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('échec WebGL : alternative visible et commandes utilisables', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
          if (['webgl', 'webgl2', 'experimental-webgl'].includes(contextId)) return null;
          return Reflect.apply(original, this, [contextId, ...args]);
        },
      });
    });
    await openPage(page);
    const fallback = page.locator('[data-engine] .engine-fallback');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveCSS('opacity', '1');
    await page.locator('button[data-engine-mode="ai"]').click();
    await expect(page.locator('button[data-engine-mode="ai"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('main a[href="/contact"]').first()).toBeVisible();
  });
});

test.describe('Adaptation, contenu et accessibilité', () => {
  for (const width of [360, 390, 768, 1440, 1920]) {
    test(`composition sans débordement à ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const path of ['/', '/services', '/realisations', '/contact', '/lab']) {
        await openPage(page, path);
        await expectNoOverflow(page);
      }
      await openPage(page);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.screenshot({ path: testInfo.outputPath(`accueil-${width}.png`), fullPage: true });
    });
  }

  test('sans JavaScript, l’offre et les liens éditoriaux restent lisibles', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    try {
      for (const path of ['/', '/services', '/realisations', '/a-propos', '/contact']) {
        const response = await page.goto(new URL(path, baseURL).href);
        expect(response?.status()).toBe(200);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('.desktop-nav a[href="/services"]')).toBeVisible();
        await expect(page.locator('main')).not.toBeEmpty();
      }
    } finally {
      await context.close();
    }
  });

  test('scripts retardés : contenu et CTA disponibles avant chargement puis navigation', async ({
    page,
  }) => {
    let releaseScripts!: () => void;
    let pendingScripts = 0;
    const scriptsGate = new Promise<void>((resolve) => {
      releaseScripts = resolve;
    });
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'script') {
        pendingScripts++;
        await scriptsGate;
      }
      await route.continue();
    });
    try {
      const response = await page.goto('/', { waitUntil: 'commit' });
      expect(response?.status()).toBe(200);
      await expect.poll(() => pendingScripts).toBeGreaterThan(0);
      await expect(page.locator('main h1')).toBeVisible();
      const contact = page.locator('main a[href="/contact"]').first();
      await expect(contact).toBeVisible();
      await contact.click({ trial: true });
      await expect(page.locator('[data-engine] canvas')).toHaveCount(0);
      await expect(page.locator('[data-engine] .engine-fallback')).toHaveCSS('opacity', '1');
      releaseScripts();
      await page.waitForLoadState('domcontentloaded');
      await page.locator('.desktop-nav a[href="/services"]').click();
      await expect(page).toHaveURL(/\/services$/);
      await expect(page.locator('main h1')).toBeVisible();
    } finally {
      releaseScripts();
      await page.unrouteAll({ behavior: 'wait' });
    }
  });

  test('polices indisponibles : contenu et contact sans débordement à 360px', async ({
    page,
  }, testInfo) => {
    let blockedFonts = 0;
    await page.setViewportSize({ width: 360, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(/\.woff2(?:\?.*)?$/, async (route) => {
      blockedFonts++;
      await route.abort('failed');
    });
    await openPage(page);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    expect(
      blockedFonts,
      'Le scénario doit effectivement bloquer les polices du site',
    ).toBeGreaterThan(0);
    await expectNoOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('accueil-polices-absentes-360.png'),
      fullPage: true,
    });
    await page.locator('main a[href="/contact"]').first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('[data-contact-form]')).toBeVisible();
    await expectNoOverflow(page);
  });

  test('sans JavaScript sur mobile : navigation visible et liens utilisables', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 360, height: 844 },
    });
    const page = await context.newPage();
    try {
      await openPage(page);
      const services = page.locator('.desktop-nav a[href="/services"]');
      await expect(services).toBeVisible();
      await expect(page.locator('.menu-toggle')).not.toBeVisible();
      await expectNoOverflow(page);
      await services.click();
      await expect(page).toHaveURL(/\/services$/);
      await expect(page.locator('main h1')).toBeVisible();
      await expectNoOverflow(page);
      await page.locator('main a[href="/contact"]').first().click();
      await expect(page).toHaveURL(/\/contact$/);
      await expect(page.locator('[data-contact-form]')).toBeVisible();
      await expectNoOverflow(page);
    } finally {
      await context.close();
    }
  });

  test('zoom simulé 200 % : reflow de lecture et contact accessible', async ({ page }) => {
    // Un viewport CSS divisé par deux vérifie le reflow ; il ne simule pas le zoom natif du navigateur.
    await page.setViewportSize({ width: 720, height: 500 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPage(page);
    await expectNoOverflow(page);
    await expect(page.locator('main a[href="/contact"]').first()).toBeVisible();
  });

  for (const path of ['/', '/services', '/realisations', '/contact', '/lab']) {
    test(`audit axe WCAG A/AA ${path}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openPage(page, path);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      await testInfo.attach('axe-results', {
        body: JSON.stringify(result.violations, null, 2),
        contentType: 'application/json',
      });
      expect(result.violations).toEqual([]);
    });
  }
});

test.describe('Contact fermé en préproduction', () => {
  test('le formulaire ne peut pas collecter et explique son état', async ({ page }) => {
    await openPage(page, '/contact');
    await expect(page.locator('[data-contact-form]')).toHaveAttribute('data-enabled', 'false');
    await expect(page.locator('[data-contact-form] button[type="submit"]')).toBeDisabled();
    await expect(page.locator('main')).toContainText(/préproduction/i);
  });

  test('l’API refuse même une soumission directe et n’annonce aucun enregistrement', async ({
    request,
    baseURL,
  }) => {
    const response = await request.post('/api/contact', {
      headers: { Origin: new URL(baseURL!).origin },
      data: {
        name: 'Visiteur de test',
        email: 'visiteur@example.test',
        message: 'Projet synthétique de test, sans donnée réelle.',
      },
    });
    expect(response.status()).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, code: 'contact_disabled' });
    expect(response.headers()['cache-control']).toContain('no-store');
    expect((await request.get('/api/contact')).status()).toBe(405);
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
  });
});
