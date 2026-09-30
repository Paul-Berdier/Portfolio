import type { APIRoute } from 'astro';
import { brand } from '../config/brand';
import { services } from '../content/services';
import { publishedProjects } from '../content/projects';
export const GET: APIRoute = () => {
  const paths =
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
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escape(new URL(path, brand.siteUrl).href)}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
