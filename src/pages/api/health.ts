import type { APIRoute } from 'astro';

export const prerender = false;
// La santé du service éditorial est indépendante du stockage des demandes.
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
