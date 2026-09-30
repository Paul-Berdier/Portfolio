import { create } from 'fontkitten';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { symbolSVG, symbolMarkup } from '../src/brand/ribbon.mjs';
import { palette, tagline } from '../src/brand/palette.mjs';

const font = create(
  await readFile(
    'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
  ),
);
const name = process.env.PUBLIC_BRAND_NAME || 'MorphAI';
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
// Outlines from the existing OFL font. A small outline emboldening is deliberate:
// Fontkitten's WOFF2 variation access is incomplete; no substitute font is loaded.
function outline(text, size, tracking = 0, accent = false) {
  const scale = size / font.unitsPerEm;
  let x = 0;
  const paths = [];
  for (const [index, char] of [...text].entries()) {
    const glyph = font.glyphForCodePoint(char.codePointAt(0));
    paths.push(
      `<path${accent && index >= 5 ? ' data-wordmark-ai=""' : ''} d="${glyph.path.toSVG()}" transform="translate(${x.toFixed(3)} 0) scale(${scale} ${-scale})" fill="currentColor" stroke="currentColor" stroke-width="${size > 30 ? 42 : 8}" stroke-linejoin="round"/>`,
    );
    x += (glyph.advanceWidth + tracking) * scale;
  }
  return { markup: paths.join(''), width: x - tracking * scale };
}
const word = outline(name, 100, -18, name === 'MorphAI'),
  signature = outline(tagline.toUpperCase(), 14, 145);
await mkdir('public/brand', { recursive: true });
await writeFile(
  'src/brand/type.generated.json',
  JSON.stringify(
    {
      name,
      word,
      signature,
      source: 'Space Grotesk variable 5.3.0, OFL; default glyph outlines with optical emboldening',
    },
    null,
    2,
  ) + '\n',
);
const logo = (vertical = false, light = false) => {
  const width = vertical ? 640 : 880,
    height = vertical ? 450 : 240;
  const symbol = vertical ? 'translate(80 20)' : 'translate(24 38) scale(.68)';
  const tx = vertical ? (640 - word.width) / 2 : 375,
    ty = vertical ? 350 : 133;
  const signX = vertical ? (640 - signature.width) / 2 : 377,
    signY = vertical ? 392 : 174;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(name + ' — ' + tagline)}"><style>[data-wordmark-ai]{color:${light ? palette.deepViolet : palette.periwinkle}}</style><g transform="${symbol}">${symbolMarkup('export')}</g><g transform="translate(${tx} ${ty})" color="${light ? palette.navy : palette.ivory}">${word.markup}</g><g transform="translate(${signX} ${signY})" color="${light ? palette.navy : palette.muted}">${signature.markup}</g></svg>`;
};
const assets = {
  'symbol-color.svg': symbolSVG('symbol-color'),
  'symbol-white.svg': symbolSVG('symbol-white', { variant: 'white' }),
  'symbol-dark.svg': symbolSVG('symbol-dark', { variant: 'dark' }),
  'logo-horizontal-dark.svg': logo(),
  'logo-horizontal-light.svg': logo(false, true),
  'logo-vertical-dark.svg': logo(true),
  'logo-vertical-light.svg': logo(true, true),
};
for (const [file, svg] of Object.entries(assets))
  await writeFile(`public/brand/${file}`, svg + '\n');
await writeFile('public/mark-monochrome.svg', assets['symbol-white.svg'] + '\n');
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${palette.navy}"/><g transform="translate(4 14) scale(.12 .15)">${symbolMarkup('icon', { small: true })}</g></svg>`;
await writeFile('public/favicon.svg', icon + '\n');
for (const size of [32, 192, 512])
  await sharp(Buffer.from(icon)).resize(size, size).png().toFile(`public/brand/icon-${size}.png`);
await sharp(Buffer.from(icon)).resize(180, 180).png().toFile('public/brand/apple-touch-icon.png');
await sharp(Buffer.from(assets['symbol-color.svg']))
  .resize(960, 480)
  .png()
  .toFile('public/brand/symbol-color.png');
await sharp(Buffer.from(assets['logo-horizontal-dark.svg']))
  .resize(1760, 480)
  .png()
  .toFile('public/brand/logo-horizontal.png');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${palette.navy}"/><path d="M60 555H1140" stroke="${palette.border}"/><g transform="translate(650 130) scale(1.05)">${symbolMarkup('og')}</g><g transform="translate(60 125) scale(.82)" color="${palette.ivory}">${word.markup}</g><style>[data-wordmark-ai]{color:${palette.periwinkle}}</style><g font-family="Arial,sans-serif"><text x="60" y="225" fill="${palette.muted}" font-size="16" letter-spacing="3">PAUL BERDIER · INDÉPENDANT</text><text x="56" y="321" fill="${palette.ivory}" font-size="70">Vos idées</text><text x="56" y="404" fill="${palette.periwinkle}" font-size="70">prennent forme.</text><text x="60" y="488" fill="${palette.muted}" font-size="22">Web · Applications · Automatisation · Data · IA</text><text x="60" y="598" fill="${palette.muted}" font-size="16">Toulouse &amp; France à distance</text></g></svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og.png');
console.log(
  JSON.stringify({ event: 'brand_exports', svg: Object.keys(assets).length + 2, png: 7, name }),
);
