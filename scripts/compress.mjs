import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { brotliCompress, gzip, constants } from 'node:zlib';

const brotli = promisify(brotliCompress);
const gzipAsync = promisify(gzip);
const clientDirectory = fileURLToPath(new URL('../dist/client/', import.meta.url));
const compressible = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.svg',
  '.xml',
  '.txt',
  '.webmanifest',
]);

/** Le point d’entrée CLI travaille exclusivement sur dist/client, sans suivre de liens. */
export async function compressClient(directory = clientDirectory) {
  const summary = { files: 0, originalBytes: 0, brotliBytes: 0, gzipBytes: 0 };
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    if (entries.some((entry) => entry.isSymbolicLink()))
      throw new Error('STATIC_SYMLINK_FORBIDDEN');
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const filename = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(filename);
        continue;
      }
      if (!entry.isFile() || !compressible.has(extname(entry.name).toLowerCase())) continue;
      const content = await readFile(filename);
      for (const encoding of ['br', 'gz']) {
        const output = `${filename}.${encoding}`;
        const compressed =
          content.length > 1024
            ? encoding === 'br'
              ? await brotli(content, {
                  params: {
                    [constants.BROTLI_PARAM_QUALITY]: 11,
                    [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
                  },
                })
              : await gzipAsync(content, { level: 9 })
            : null;
        if (compressed && compressed.length < content.length) {
          await writeFile(output, compressed);
          if (encoding === 'br') summary.brotliBytes += compressed.length;
          else summary.gzipBytes += compressed.length;
        } else {
          await unlink(output).catch((error) => {
            if (error.code !== 'ENOENT') throw error;
          });
          if (encoding === 'br') summary.brotliBytes += content.length;
          else summary.gzipBytes += content.length;
        }
      }
      summary.files += 1;
      summary.originalBytes += content.length;
    }
  }
  await walk(directory);
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const summary = await compressClient();
  console.log(JSON.stringify({ event: 'static_precompression', ...summary }));
}
