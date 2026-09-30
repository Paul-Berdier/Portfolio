import type { APIRoute } from 'astro';
import { brand } from '../config/brand';
export const GET: APIRoute = () => {
  const live = brand.production && brand.legalValidated && brand.siteUrl;
  return new Response(
    live
      ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${brand.siteUrl}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
