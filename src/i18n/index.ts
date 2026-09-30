import { brand } from '../config/brand';

export const locales = ['fr', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

/** French URLs stay stable; each translation has a directly addressable URL. */
export const routePairs = [
  ['/', '/en', '/es'],
  ['/services', '/en/services', '/es/servicios'],
  ['/services/developpement-web', '/en/services/web-development', '/es/servicios/desarrollo-web'],
  ['/services/automatisation', '/en/services/automation', '/es/servicios/automatizacion'],
  ['/services/data', '/en/services/data', '/es/servicios/datos'],
  [
    '/services/intelligence-artificielle',
    '/en/services/artificial-intelligence',
    '/es/servicios/inteligencia-artificial',
  ],
  ['/realisations', '/en/work', '/es/proyectos'],
  ['/realisations/flux-documents', '/en/work/document-workflow', '/es/proyectos/flujo-documental'],
  ['/realisations/atelier-data', '/en/work/data-workbench', '/es/proyectos/taller-de-datos'],
  ['/a-propos', '/en/about', '/es/sobre-mi'],
  ['/lab', '/en/lab', '/es/lab'],
  ['/contact', '/en/contact', '/es/contacto'],
  ['/mentions-legales', '/en/legal', '/es/aviso-legal'],
  ['/confidentialite', '/en/privacy', '/es/privacidad'],
] as const;

export function localeFromPath(pathname: string): Locale {
  return /^\/en(?:\/|$)/.test(pathname) ? 'en' : /^\/es(?:\/|$)/.test(pathname) ? 'es' : 'fr';
}

export function translate<T>(locale: Locale, french: T, english: T, spanish: T): T {
  return locale === 'en' ? english : locale === 'es' ? spanish : french;
}

export function alternatePaths(pathname: string): Record<Locale, string> | undefined {
  const path = pathname.replace(/\/$/, '') || '/';
  const pair = routePairs.find(([fr, en, es]) => fr === path || en === path || es === path);
  return pair ? { fr: pair[0], en: pair[1], es: pair[2] } : undefined;
}

export function localizePath(path: string, locale: Locale): string {
  const start = path.search(/[?#]/);
  const pathname = start < 0 ? path : path.slice(0, start);
  const suffix = start < 0 ? '' : path.slice(start);
  const alternate = alternatePaths(pathname);
  return (alternate?.[locale] ?? pathname) + suffix;
}

export function getBrand(locale: Locale) {
  return {
    ...brand,
    tagline: translate(locale, brand.tagline, 'Giving shape to your ideas', 'Da forma a tus ideas'),
    location: translate(
      locale,
      brand.location,
      'Toulouse · Working remotely across France',
      'Toulouse · Trabajo a distancia en Francia',
    ),
    description: translate(
      locale,
      brand.description,
      'Websites and applications, automation, data and artificial intelligence. Tailored tools, from the first conversation to delivery, by Paul Berdier.',
      'Sitios y aplicaciones web, automatización, datos e inteligencia artificial. Herramientas a medida, de la primera conversación a la entrega, por Paul Berdier.',
    ),
  };
}

export function getNavigation(locale: Locale) {
  return [
    {
      href: localizePath('/services', locale),
      label: translate(locale, 'Expertises', 'Services', 'Servicios'),
    },
    {
      href: localizePath('/realisations', locale),
      label: translate(locale, 'Réalisations', 'Work', 'Proyectos'),
    },
    {
      href: localizePath('/a-propos', locale),
      label: translate(locale, 'À propos', 'About me', 'Sobre mí'),
    },
    { href: localizePath('/lab', locale), label: translate(locale, 'Le lab', 'The lab', 'El lab') },
  ];
}
