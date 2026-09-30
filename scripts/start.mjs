import { createServer } from 'node:http';
import { isIP } from 'node:net';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sirv from 'sirv';

const clientDirectory = fileURLToPath(new URL('../dist/client/', import.meta.url));
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function readListenOptions(environment = process.env) {
  const host = environment.HOST || '0.0.0.0';
  const port = environment.PORT || '4321';
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error('PORT_INVALID');
  const hostname =
    host.length <= 253 &&
    host.split('.').every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label));
  if (!isIP(host) && !hostname) throw new Error('HOST_INVALID');
  return { host, port: Number(port) };
}

function inventory(directory, prefix = '', files = new Set()) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('STATIC_SYMLINK_FORBIDDEN');
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
    const name = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) inventory(join(directory, entry.name), name, files);
    else if (entry.isFile()) files.add(name);
  }
  return files;
}

/** Sirv ne traite pas les poids q : la sélection respecte les exclusions q=0. */
export function chooseEncoding(header, available) {
  const preferences = new Map();
  for (const part of (header || '').split(',')) {
    const [name, ...parameters] = part.trim().toLowerCase().split(';');
    if (!name) continue;
    const q = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith('q='));
    const quality = q ? Number(q.slice(2)) : 1;
    preferences.set(name, Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0);
  }
  const quality = (encoding) => preferences.get(encoding) ?? preferences.get('*') ?? 0;
  const compressed = ['br', 'gzip']
    .filter((encoding) => available.includes(encoding) && quality(encoding) > 0)
    .sort((first, second) => quality(second) - quality(first));
  const identity = preferences.get('identity');
  if (
    identity !== undefined &&
    identity > 0 &&
    (!compressed.length || identity > quality(compressed[0]))
  )
    return 'identity';
  if (compressed.length) return compressed[0];
  return identity === 0 || (identity === undefined && preferences.get('*') === 0)
    ? null
    : 'identity';
}

export function createRequestListener(astroHandler, directory = clientDirectory) {
  const files = inventory(directory);
  const serve = sirv(directory, { etag: true, extensions: [], dotfiles: false });
  return (request, response) => {
    for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);
    let pathname;
    try {
      const rawPath = (request.url || '/').split('?')[0];
      const decodedPath = decodeURIComponent(rawPath);
      if (
        !decodedPath.startsWith('/') ||
        decodedPath.includes('\\') ||
        decodedPath.includes('\0') ||
        decodedPath.split('/').some((segment) => segment === '..' || segment === '.')
      )
        throw new Error('INVALID_PATH');
      pathname = decodeURI(rawPath);
    } catch {
      response.writeHead(400, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end('Requête invalide.');
      return;
    }
    const base = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const asset =
      ['GET', 'HEAD'].includes(request.method || '') &&
      !/^\/404(?:\.html|\/index\.html|\/)?$/.test(pathname)
        ? [base, `${base}/index`, `${base}.html`, `${base}/index.html`].find((candidate) =>
            files.has(candidate),
          )
        : undefined;
    if (asset && !/\.(?:br|gz|map|astro|ts|tsx)$/.test(asset)) {
      const available = [];
      if (files.has(`${asset}.br`)) available.push('br');
      if (files.has(`${asset}.gz`)) available.push('gzip');
      const encoding = chooseEncoding(request.headers['accept-encoding'], available);
      response.setHeader('Vary', 'Accept-Encoding');
      response.setHeader(
        'Cache-Control',
        asset.startsWith('/_astro/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=0, must-revalidate',
      );
      if (!encoding) {
        response.writeHead(406, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        response.end('Aucun encodage accepté disponible.');
        return;
      }
      const originalUrl = request.url;
      request.url = encodeURI(
        asset + (encoding === 'br' ? '.br' : encoding === 'gzip' ? '.gz' : ''),
      );
      // Sirv déduit le MIME original et Content-Encoding à partir de .br/.gz.
      serve(request, response, () => {
        request.url = originalUrl;
        void forwardToAstro();
      });
      request.url = originalUrl;
      return;
    }
    void forwardToAstro();
    async function forwardToAstro() {
      try {
        await astroHandler(request, response);
      } catch {
        console.error(JSON.stringify({ event: 'http_handler_error' }));
        if (response.headersSent) response.destroy();
        else {
          response.writeHead(500, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          response.end('Erreur interne.');
        }
      }
    }
  };
}

export async function startServer() {
  const { host, port } = readListenOptions();
  process.env.ASTRO_NODE_AUTOSTART = 'disabled';
  const { handler } = await import('../dist/server/entry.mjs');
  const server = createServer(createRequestListener(handler));
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  server.on('error', (error) => {
    console.error(JSON.stringify({ event: 'server_error', code: error.code || 'UNKNOWN' }));
    process.exitCode = 1;
  });
  server.listen(port, host, () =>
    console.log(JSON.stringify({ event: 'server_listening', host, port })),
  );
  const shutdown = () => {
    server.close();
    server.closeIdleConnections();
    setTimeout(() => server.closeAllConnections(), 10_000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await startServer();
