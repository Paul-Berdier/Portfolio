import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Independent URL expectations: importing application helpers here would hide
// an incorrect mapping and would require Astro's import.meta.env at test load.
type Locale = 'fr' | 'en' | 'es';
const locales: Locale[] = ['fr', 'en', 'es'];
const routeCases = [
  { paths: ['/', '/en', '/es'], titles: [/Vos idées/, /Your ideas/, /Tus ideas/] },
  {
    paths: ['/services', '/en/services', '/es/servicios'],
    titles: [/Expertises/, /Services/, /Servicios/],
  },
  {
    paths: [
      '/services/developpement-web',
      '/en/services/web-development',
      '/es/servicios/desarrollo-web',
    ],
    titles: [/Développement web/, /Web development/, /Desarrollo web/],
  },
  {
    paths: ['/services/automatisation', '/en/services/automation', '/es/servicios/automatizacion'],
    titles: [/Automatisation/, /Automation/, /Automatización/],
  },
  {
    paths: ['/services/data', '/en/services/data', '/es/servicios/datos'],
    titles: [/Data/, /Data/, /Datos/],
  },
  {
    paths: [
      '/services/intelligence-artificielle',
      '/en/services/artificial-intelligence',
      '/es/servicios/inteligencia-artificial',
    ],
    titles: [/Intelligence artificielle/, /Artificial intelligence/, /Inteligencia artificial/],
  },
  {
    paths: ['/realisations', '/en/work', '/es/proyectos'],
    titles: [/Réalisations/, /Work/, /Proyectos/],
  },
  {
    paths: [
      '/realisations/flux-documents',
      '/en/work/document-workflow',
      '/es/proyectos/flujo-documental',
    ],
    titles: [/Du document/, /Every document/, /Cada documento/],
  },
  {
    paths: [
      '/realisations/atelier-data',
      '/en/work/data-workbench',
      '/es/proyectos/taller-de-datos',
    ],
    titles: [/Des lignes/, /From rows/, /De las filas/],
  },
  { paths: ['/a-propos', '/en/about', '/es/sobre-mi'], titles: [/À propos/, /About/, /Sobre/] },
  { paths: ['/lab', '/en/lab', '/es/lab'], titles: [/lab/i, /lab/i, /lab/i] },
  { paths: ['/contact', '/en/contact', '/es/contacto'], titles: [/projet/, /project/, /proyecto/] },
  {
    paths: ['/mentions-legales', '/en/legal', '/es/aviso-legal'],
    titles: [/Mentions légales/, /Legal/, /Aviso legal/],
  },
  {
    paths: ['/confidentialite', '/en/privacy', '/es/privacidad'],
    titles: [/Confidentialité/, /Privacy/, /Privacidad/],
  },
] as const;
const names = { fr: 'Français', en: 'English', es: 'Español' };
const switcherNames = { fr: 'Langue du site', en: 'Website language', es: 'Idioma del sitio' };
const ogLocales = { fr: 'fr_FR', en: 'en_GB', es: 'es_ES' };
const normalizedPath = (path: string) => path.replace(/\/$/, '') || '/';

async function openPage(page: Page, path: string, locale: Locale) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('main h1')).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
}

test.describe('Routes éditoriales localisées', () => {
  for (const route of routeCases) {
    for (const [index, locale] of locales.entries()) {
      const path = route.paths[index]!;
      test(`${locale} : ${path}, métadonnées et liens internes`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openPage(page, path, locale);
        expect((await page.locator('main h1').innerText()).trim().length).toBeGreaterThan(5);
        await expect(page).toHaveTitle(route.titles[index]!);
        const title = await page.title();
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description?.trim().length).toBeGreaterThan(25);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
          'content',
          description!,
        );
        await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
          'content',
          ogLocales[locale],
        );
        expect(
          await page
            .locator('meta[property="og:locale:alternate"]')
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content')).sort()),
        ).toEqual(
          locales
            .filter((item) => item !== locale)
            .map((item) => ogLocales[item])
            .sort(),
        );
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

        const switcher = page.getByRole('navigation', { name: switcherNames[locale], exact: true });
        await expect(switcher).toBeVisible();
        for (const [languageIndex, language] of locales.entries()) {
          const link = switcher.getByRole('link', { name: names[language], exact: true });
          await expect(link).toHaveAttribute('href', route.paths[languageIndex]!);
          await expect(link).toHaveAttribute('lang', language);
          await expect(link).toHaveAttribute('hreflang', language);
        }
        await expect(switcher.locator('[aria-current]')).toHaveCount(1);
        await expect(switcher.locator('[aria-current]')).toHaveAttribute('data-language', locale);

        const canonical = page.locator('link[rel="canonical"]');
        if (await canonical.count()) {
          expect(normalizedPath(new URL((await canonical.getAttribute('href'))!).pathname)).toBe(
            path,
          );
          for (const [languageIndex, language] of locales.entries()) {
            const alternate = await page
              .locator('link[rel="alternate"][hreflang="' + language + '"]')
              .getAttribute('href');
            expect(normalizedPath(new URL(alternate!).pathname)).toBe(route.paths[languageIndex]);
          }
        }

        const links = await page.locator('a[href]').evaluateAll((anchors) =>
          anchors
            .filter(
              (anchor) =>
                !anchor.closest('[data-language-switcher]') && !anchor.hasAttribute('download'),
            )
            .map((anchor) => new URL(anchor.getAttribute('href')!, document.baseURI))
            .filter((url) => url.origin === location.origin)
            .map((url) => url.pathname),
        );
        let editorialLinks = 0;
        for (const href of links) {
          const pair = routeCases.find((item) =>
            item.paths.some((candidate) => candidate === normalizedPath(href)),
          );
          if (!pair) continue; // Downloads and server endpoints are not translated pages.
          editorialLinks++;
          expect(normalizedPath(href), 'Le lien conserve la langue : ' + href).toBe(
            pair.paths[index],
          );
        }
        expect(editorialLinks).toBeGreaterThan(5);
      });
    }
  }
});

test.describe('Sélecteur de langue et pages profondes', () => {
  const deepRoutes = [routeCases[2], routeCases[7]] as const;
  for (const width of [360, 390, 768, 1440]) {
    for (const route of deepRoutes) {
      test(`même page au clavier, ${width}px : ${route.paths[0]}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openPage(page, route.paths[0], 'fr');
        for (const locale of ['en', 'es', 'fr'] as const) {
          const link = page
            .locator('[data-language-switcher]')
            .getByRole('link', { name: names[locale], exact: true });
          await expect(link).toBeVisible();
          await link.focus();
          await expect(link).toBeFocused();
          await link.press('Enter');
          const index = locales.indexOf(locale);
          await expect
            .poll(() => normalizedPath(new URL(page.url()).pathname))
            .toBe(route.paths[index]);
          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page).toHaveTitle(route.titles[index]!);
          await expect(
            page.getByRole('navigation', { name: switcherNames[locale], exact: true }),
          ).toBeVisible();
          await expectNoOverflow(page);
        }
      });
    }
  }
});

test.describe('Navigation et moteur dans les langues traduites', () => {
  for (const locale of ['en', 'es'] as const) {
    test(`${locale} : captions, navigation client et historique sans canvas dupliqué`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await openPage(page, '/' + locale, locale);
      const engine = page.locator('[data-engine]');
      await expect(engine).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
      await expect(engine.locator('canvas')).toHaveCount(1);
      const translatedWords =
        locale === 'en'
          ? /material|ribbon|shape|document|information|source|data|flow|step|task|interface|tool|signature/i
          : /materia|cinta|forma|document|informaci|fuente|datos|flujo|etapa|tarea|interfaz|herramienta|firma/i;
      for (const mode of ['web', 'automation', 'data', 'ai', 'brand']) {
        const button = engine.locator('[data-engine-mode="' + mode + '"]');
        await button.press('Enter');
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        const caption = engine.locator('[data-engine-caption]');
        await expect(caption).toContainText(translatedWords);
        await expect(caption).not.toContainText(
          /Vos idées|Les tâches|Vos données|Une matière|informations et sources/,
        );
        await expect(engine.locator('canvas')).toHaveCount(1);
      }
      await page.evaluate(() => Reflect.set(window, '__i18nNavigationToken', 'same-client-window'));
      const servicesPath = locale === 'en' ? '/en/services' : '/es/servicios';
      await page.locator('.desktop-nav a[href="' + servicesPath + '"]').click();
      await expect.poll(() => new URL(page.url()).pathname).toBe(servicesPath);
      expect(await page.evaluate(() => Reflect.get(window, '__i18nNavigationToken'))).toBe(
        'same-client-window',
      );
      await expect(page.locator('[data-engine] canvas')).toHaveCount(0);
      await page.goBack();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(engine).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
      await expect(engine.locator('canvas')).toHaveCount(1);
      await expect(engine.locator('[data-engine-caption]')).toContainText(translatedWords);
      await page.goForward();
      await expect.poll(() => new URL(page.url()).pathname).toBe(servicesPath);
      await expect(page.locator('[data-engine] canvas')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('Lecture sans JavaScript et accessibilité traduite', () => {
  for (const locale of ['en', 'es'] as const) {
    test(`${locale} : accueil, service et étude de cas sans JavaScript`, async ({
      browser,
      baseURL,
    }) => {
      const context = await browser.newContext({
        baseURL,
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      try {
        await openPage(page, '/' + locale, locale);
        await expect(page.locator('main h1')).toContainText(
          locale === 'en' ? 'Your ideas' : 'Tus ideas',
        );
        await expect(page.locator('[data-engine] canvas')).toHaveCount(0);
        const servicesPath = locale === 'en' ? '/en/services' : '/es/servicios';
        await page.locator('.desktop-nav a[href="' + servicesPath + '"]').click();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        const deepService =
          locale === 'en' ? '/en/services/web-development' : '/es/servicios/desarrollo-web';
        await page.locator('main h2 a[href="' + deepService + '"]').click();
        await expect(page.locator('main h1')).toContainText(
          locale === 'en' ? 'An idea becomes' : 'Una idea se convierte',
        );
        const projectPath =
          locale === 'en' ? '/en/work/document-workflow' : '/es/proyectos/flujo-documental';
        await page.locator('a.related-project[href="' + projectPath + '"]').click();
        await expect(page.locator('main h1')).toContainText(
          locale === 'en' ? 'Every document' : 'Cada documento',
        );
        await expect(page.locator('main')).toContainText(
          locale === 'en' ? 'synthetic' : 'sintético',
        );
        await expect(
          page.locator('main a[href="/' + locale + '/lab#workflow"]').first(),
        ).toBeVisible();
        await page
          .locator('[data-language-switcher]')
          .getByRole('link', { name: 'Français', exact: true })
          .click();
        await expect.poll(() => new URL(page.url()).pathname).toBe('/realisations/flux-documents');
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expectNoOverflow(page);
      } finally {
        await context.close();
      }
    });

    for (const width of [390, 1440]) {
      for (const route of ['contact', 'about'] as const) {
        const path =
          locale === 'en' ? '/en/' + route : route === 'contact' ? '/es/contacto' : '/es/sobre-mi';
        test(`axe ${locale} ${route}, ${width}px`, async ({ page }, testInfo) => {
          await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await openPage(page, path, locale);
          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
          await testInfo.attach('axe-' + locale + '-' + route + '-' + width, {
            body: JSON.stringify(result, null, 2),
            contentType: 'application/json',
          });
          expect(result.violations).toEqual([]);
          await expectNoOverflow(page);
        });
      }
    }
  }
});
