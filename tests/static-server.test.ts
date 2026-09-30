import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, request, type Server } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { chooseEncoding, createRequestListener, readListenOptions } from '../scripts/start.mjs';
import { compressClient } from '../scripts/compress.mjs';

describe('serveur statique précompressé sur HTTP local', () => {
  let directory: string;
  let server: Server;
  let port: number;
  const javascript = 'const message = "contenu de test compressible";\n'.repeat(150);
  const html = '<!doctype html><html lang="fr"><p>Page pré-rendue</p></html>'.repeat(80);
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'portfolio-static-test-'));
    await mkdir(join(directory, '_astro'));
    await mkdir(join(directory, 'services'));
    await writeFile(join(directory, '_astro', 'script.hash.js'), javascript);
    await writeFile(join(directory, 'index.html'), html);
    await writeFile(join(directory, 'services', 'index.html'), html);
    await writeFile(join(directory, 'short.txt'), 'court');
    await writeFile(join(directory, 'image.jpg'), Buffer.alloc(2048));
    await compressClient(directory);
    const fallback = (_request: unknown, response: import('node:http').ServerResponse) => { response.writeHead(404, { 'Content-Type': 'text/plain' }); response.end('astro-fallback'); };
    server = createServer(createRequestListener(fallback, directory));
    await new Promise<void>(resolveListening => server.listen(0, '127.0.0.1', resolveListening));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port de test non disponible.');
    port = address.port;
  });
  afterAll(async () => {
    if (server?.listening) await new Promise<void>((resolveClosed, reject) => server.close(error => error ? reject(error) : resolveClosed()));
    // La suppression est bornée au répertoire temporaire créé par ce test.
    if (directory && resolve(directory).startsWith(resolve(tmpdir()) + sep) && directory.includes('portfolio-static-test-')) await rm(directory, { recursive: true, force: true });
  });
  const get = (path: string, headers: Record<string, string> = {}, method = 'GET') => new Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; body: Buffer }>((resolveResponse, reject) => {
    const outgoing = request({ host: '127.0.0.1', port, path, headers, method }, response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(Buffer.from(chunk)));
      response.on('end', () => resolveResponse({ status: response.statusCode!, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    outgoing.on('error', reject); outgoing.end();
  });

  it('sert Brotli avec le bon MIME et le cache des assets fingerprintés', async () => {
    const response = await get('/_astro/script.hash.js', { 'Accept-Encoding': 'gzip, br' });
    expect(response.status).toBe(200);
    expect(response.headers['content-encoding']).toBe('br');
    expect(response.headers['content-type']).toMatch(/javascript/);
    expect(response.headers['cache-control']).toContain('immutable');
    expect(response.headers.vary).toBe('Accept-Encoding');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(brotliDecompressSync(response.body).toString()).toBe(javascript);
    expect(response.body.length).toBeLessThan(Buffer.byteLength(javascript));
  });
  it('respecte gzip préféré et Brotli explicitement exclu', async () => {
    const response = await get('/_astro/script.hash.js', { 'Accept-Encoding': 'br;q=0, gzip;q=1' });
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(gunzipSync(response.body).toString()).toBe(javascript);
  });
  it('sert les index HTML avec revalidation et supporte HEAD / ETag', async () => {
    const first = await get('/services', { 'Accept-Encoding': 'br' });
    expect(first.status).toBe(200);
    expect(first.headers['content-type']).toMatch(/text\/html/);
    expect(first.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
    expect(brotliDecompressSync(first.body).toString()).toBe(html);
    const cached = await get('/services', { 'Accept-Encoding': 'br', 'If-None-Match': String(first.headers.etag) });
    expect(cached.status).toBe(304);
    expect(cached.headers.vary).toBe('Accept-Encoding');
    const head = await get('/', { 'Accept-Encoding': 'gzip' }, 'HEAD');
    expect(head.status).toBe(200); expect(head.body.length).toBe(0);
    expect(head.headers['content-encoding']).toBe('gzip');
  });
  it('sert une représentation non compressée et refuse tout encodage exclu', async () => {
    const plain = await get('/_astro/script.hash.js', { 'Accept-Encoding': 'br;q=0, gzip;q=0' });
    expect(plain.headers['content-encoding']).toBeUndefined();
    expect(plain.body.toString()).toBe(javascript);
    expect((await get('/short.txt', { 'Accept-Encoding': 'identity;q=0, *;q=0' })).status).toBe(406);
  });
  it('refuse la traversée et transmet les routes inconnues / POST au handler', async () => {
    expect((await get('/%2e%2e/package.json')).status).toBe(400);
    expect((await get('/%5c..%5cpackage.json')).status).toBe(400);
    expect((await get('/%ZZ')).status).toBe(400);
    for (const path of ['/src/config/brand.ts', '/.env', '/absent', '/_astro/script.hash.js.br', '/404']) {
      const response = await get(path); expect(response.status).toBe(404); expect(response.body.toString()).toBe('astro-fallback');
    }
    expect((await get('/services', {}, 'POST')).status).toBe(404);
  });
  it('ne recompresse pas les images ni les petits fichiers', async () => {
    await expect(readFile(join(directory, 'image.jpg.br'))).rejects.toThrow();
    await expect(readFile(join(directory, 'short.txt.gz'))).rejects.toThrow();
  });
});

describe('configuration du serveur et négociation', () => {
  it('valide HOST et PORT avant démarrage', () => {
    expect(readListenOptions({ HOST: '127.0.0.1', PORT: '4321' })).toEqual({ host: '127.0.0.1', port: 4321 });
    expect(readListenOptions({})).toEqual({ host: '0.0.0.0', port: 4321 });
    expect(() => readListenOptions({ PORT: '70000' })).toThrow('PORT_INVALID');
    expect(() => readListenOptions({ PORT: '-1' })).toThrow('PORT_INVALID');
    expect(() => readListenOptions({ HOST: 'https://localhost' })).toThrow('HOST_INVALID');
  });
  it('respecte les pondérations et préfère Brotli à égalité', () => {
    expect(chooseEncoding('br;q=0.5, gzip;q=1', ['br', 'gzip'])).toBe('gzip');
    expect(chooseEncoding('gzip, br', ['br', 'gzip'])).toBe('br');
    expect(chooseEncoding('br;q=0, *;q=1', ['br', 'gzip'])).toBe('gzip');
    expect(chooseEncoding('identity;q=1, br;q=0.1', ['br'])).toBe('identity');
    expect(chooseEncoding('br;q=0, gzip;q=0, identity;q=0', ['br', 'gzip'])).toBeNull();
  });
});
