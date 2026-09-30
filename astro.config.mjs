import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env')) loadEnvFile('.env');
const publicUrl = process.env.PUBLIC_SITE_URL ? new URL(process.env.PUBLIC_SITE_URL) : undefined;
if (publicUrl && publicUrl.protocol !== 'https:')
  throw new Error('PUBLIC_SITE_URL doit utiliser HTTPS. Laissez vide pour le développement local.');

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'static',
  session: false,
  security: {
    allowedDomains: publicUrl ? [{ hostname: publicUrl.hostname, protocol: 'https' }] : [],
  },
  adapter: node({ mode: 'middleware', bodySizeLimit: 16384, staticHeaders: true }),
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  trailingSlash: 'never',
});
