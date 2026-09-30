import type { APIRoute } from 'astro';
import { brand } from '../config/brand';
import { services } from '../content/services';
import { publishedProjects } from '../content/projects';
import { alternatePaths, localizePath, locales } from '../i18n';
export const GET: APIRoute = () => {
  const frenchPaths =
    brand.production && brand.legalValidated && brand.siteUrl
      ? [
          '/',
          '/services',
          '/realisations',
          '/a-propos',
          '/lab',
          '/contact',
          '/mentions-legales',
          '/confidentialite',
          ...services.map((s) => `/services/${s.slug}`),
          ...publishedProjects.map((p) => `/realisations/${p.slug}`),
        ]
      : [];
  const paths = frenchPaths.flatMap((path) => locales.map((locale) => localizePath(path, locale)));
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths
      .map((path) => {
        const alternatives = alternatePaths(path);
        const links = alternatives
          ? [
              ...locales.map(
                (locale) =>
                  `<xhtml:link rel="alternate" hreflang="${locale}" href="${escape(new URL(alternatives[locale], brand.siteUrl).href)}"/>`,
              ),
              `<xhtml:link rel="alternate" hreflang="x-default" href="${escape(new URL(alternatives.fr, brand.siteUrl).href)}"/>`,
            ].join('')
          : '';
        return `<url><loc>${escape(new URL(path, brand.siteUrl).href)}</loc>${links}</url>`;
      })
      .join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
