import { describe, expect, it } from 'vitest';
import {
  alternatePaths,
  getBrand,
  getNavigation,
  locales,
  localeFromPath,
  localizePath,
  routePairs,
  translate,
} from '../src/i18n';
import { getServices, services } from '../src/content/services';
import { getPublishedProjects, publishedProjects } from '../src/content/projects';

describe('routes françaises, anglaises et espagnoles', () => {
  it('définit 14 pages avec trois adresses distinctes et sans collision', () => {
    expect(locales).toEqual(['fr', 'en', 'es']);
    expect(routePairs).toHaveLength(14);
    const paths = routePairs.flat();
    expect(new Set(paths).size).toBe(42);
    expect(paths).not.toContain('/dev/brand');
    expect(paths.some((path) => path.includes('recherche-documentaire'))).toBe(false);
  });

  it.each([
    ['/', 'fr'],
    ['/services/developpement-web', 'fr'],
    ['/en', 'en'],
    ['/en/services/web-development', 'en'],
    ['/es', 'es'],
    ['/es/proyectos/flujo-documental', 'es'],
    ['/english', 'fr'],
    ['/espanol', 'fr'],
  ] as const)('reconnaît la langue de %s', (path, locale) => {
    expect(localeFromPath(path)).toBe(locale);
  });

  it('retrouve la même page depuis chacune de ses traductions et avec une barre finale', () => {
    for (const [fr, en, es] of routePairs) {
      for (const source of [fr, en, es]) {
        expect(alternatePaths(source)).toEqual({ fr, en, es });
        expect(alternatePaths(source === '/' ? '/' : source + '/')).toEqual({ fr, en, es });
        for (const locale of locales) {
          expect(localizePath(source, locale)).toBe({ fr, en, es }[locale]);
          expect(localizePath(localizePath(source, locale), localeFromPath(source))).toBe(source);
        }
      }
    }
  });

  it('conserve exactement les paramètres et l’ancre lors des allers-retours', () => {
    const suffix = '?besoin=developpement-web&note=a%23b&empty=#details?tab=1';
    expect(localizePath('/contact' + suffix, 'en')).toBe('/en/contact' + suffix);
    expect(localizePath('/en/contact' + suffix, 'es')).toBe('/es/contacto' + suffix);
    expect(localizePath('/es/contacto' + suffix, 'fr')).toBe('/contact' + suffix);
    expect(localizePath('/lab#workflow', 'es')).toBe('/es/lab#workflow');
    expect(localizePath('/es/lab#workflow', 'en')).toBe('/en/lab#workflow');
    expect(localizePath('/#expertises', 'en')).toBe('/en#expertises');
    expect(localizePath('/en#expertises', 'fr')).toBe('/#expertises');
  });

  it('ne transforme pas arbitrairement une route inconnue', () => {
    expect(alternatePaths('/une-page-inconnue')).toBeUndefined();
    expect(localizePath('/une-page-inconnue?x=1#section', 'en')).toBe(
      '/une-page-inconnue?x=1#section',
    );
    expect(localizePath('/dev/brand', 'es')).toBe('/dev/brand');
  });
});

describe('contenus localisés et compatibilité des identifiants', () => {
  it('sélectionne explicitement les trois traductions', () => {
    expect(locales.map((locale) => translate(locale, 'Bonjour', 'Hello', 'Hola'))).toEqual([
      'Bonjour',
      'Hello',
      'Hola',
    ]);
  });

  it.each(locales)('garde les identifiants et la structure des services en %s', (locale) => {
    const translated = getServices(locale);
    expect(translated.map(({ slug, number }) => ({ slug, number }))).toEqual(
      services.map(({ slug, number }) => ({ slug, number })),
    );
    for (const service of translated) {
      expect(service.needs).toHaveLength(3);
      expect(service.deliverables).toHaveLength(3);
      expect(service.tags.length).toBeGreaterThan(0);
      for (const copy of [
        service.title,
        service.description,
        service.promise,
        service.approach,
        service.boundaries,
      ]) {
        expect(copy.trim().length).toBeGreaterThan(8);
      }
      if (locale !== 'fr') {
        const original = services.find((item) => item.slug === service.slug)!;
        expect(service.title).not.toBe(original.title);
        expect(service.boundaries).not.toBe(original.boundaries);
      }
    }
    expect(getServices('fr')).toEqual(services);
  });

  it.each(locales)('garde deux démonstrateurs honnêtes et exclut le brouillon en %s', (locale) => {
    const translated = getPublishedProjects(locale);
    expect(translated).toHaveLength(2);
    expect(
      translated.map(({ slug, services, href, preview, published }) => ({
        slug,
        services,
        href,
        preview,
        published,
      })),
    ).toEqual(
      publishedProjects.map(({ slug, services, href, preview, published }) => ({
        slug,
        services,
        href,
        preview,
        published,
      })),
    );
    for (const project of translated) {
      expect(project.published).toBe(true);
      expect(project.slug).not.toBe('recherche-documentaire');
      expect(project.role).toContain('Codex');
      expect(project.context).toMatch(
        locale === 'fr' ? /synthétique/ : locale === 'en' ? /synthetic/ : /sintétic/,
      );
      expect(project.architecture).toHaveLength(4);
      expect(project.result).toHaveLength(3);
      expect(project.limits.length).toBeGreaterThan(80);
      if (locale !== 'fr')
        expect(project.title).not.toBe(
          publishedProjects.find((item) => item.slug === project.slug)!.title,
        );
    }
    expect(getPublishedProjects('fr')).toEqual(publishedProjects);
  });

  it.each(locales)(
    'localise navigation et présentation sans changer le propriétaire en %s',
    (locale) => {
      const navigation = getNavigation(locale);
      expect(navigation).toHaveLength(4);
      expect(navigation.every((item) => localeFromPath(item.href) === locale)).toBe(true);
      expect(navigation.every((item) => item.label.length > 1)).toBe(true);
      const brand = getBrand(locale);
      expect(brand.owner).toBe('Paul Berdier');
      expect(brand.location).toContain('Toulouse');
      expect(brand.tagline.length).toBeGreaterThan(10);
      expect(brand.description.length).toBeGreaterThan(50);
    },
  );
});
