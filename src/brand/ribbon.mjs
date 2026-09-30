import { palette } from './palette.mjs';

/**
 * Canonical M, drawn as two cubic Bezier edges, from left to right.
 * ViewBox 0 0 480 240. First crown higher; lower edge describes the folded return.
 * SVG exports and the orthographic Three surface sample these exact same curves.
 * No bitmap tracing or independent mesh outline.
 */
export const ribbonEdges = Object.freeze([
  [
    [8, 205],
    [36, 138, 75, 4, 121, 4],
    [177, 0, 199, 135, 258, 126],
    [290, 121, 307, 55, 355, 55],
    [398, 54, 424, 161, 459, 209],
  ],
  [
    [8, 205],
    [49, 249, 126, 22, 173, 92],
    [200, 133, 215, 217, 271, 217],
    [312, 217, 332, 132, 369, 141],
    [398, 148, 425, 215, 459, 209],
  ],
]);
const cubic = (a, b, c, d, t) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
export function edgePoint(edge, progress) {
  const u = Math.max(0, Math.min(1, progress)) * 4;
  const segment = Math.min(3, Math.floor(u));
  const t = u - segment;
  const points = ribbonEdges[edge];
  const start = segment ? points[segment].slice(-2) : points[0];
  const curve = points[segment + 1];
  return [
    cubic(start[0], curve[0], curve[2], curve[4], t),
    cubic(start[1], curve[1], curve[3], curve[5], t),
  ];
}
export const ribbonUpperPath = `M${ribbonEdges[0][0].join(' ')} ${ribbonEdges[0]
  .slice(1)
  .map((c) => `C${c.join(' ')}`)
  .join(' ')}`;
export const ribbonPath = `${ribbonUpperPath} ${ribbonEdges[1]
  .slice(1)
  .reverse()
  .map((c, i) => {
    const original = 4 - i;
    const end = original === 1 ? ribbonEdges[1][0] : ribbonEdges[1][original - 1].slice(-2);
    return `C${c[2]} ${c[3]} ${c[0]} ${c[1]} ${end.join(' ')}`;
  })
  .join(' ')} Z`;

/** Finite impulse-to-ribbon deformation, shared with SVG preview and WebGL. */
export function ribbonPoint(u, v, formation = 1) {
  const a = edgePoint(0, u),
    b = edgePoint(1, u);
  const p = Math.max(0, Math.min(1, formation));
  const x = a[0] * (1 - v) + b[0] * v;
  const y = a[1] * (1 - v) + b[1] * v;
  const impulseY = 155 + Math.sin(u * Math.PI * 2 - 0.4) * 23;
  return [8 + u * 451 + (x - 8 - u * 451) * p, impulseY * (1 - p) + y * p];
}
export function ribbonFramePath(formation = 1) {
  if (formation >= 1) return ribbonPath;
  const points = [];
  for (let i = 0; i <= 64; i++) points.push(ribbonPoint(i / 64, 0, formation));
  for (let i = 64; i >= 0; i--) points.push(ribbonPoint(i / 64, 1, formation));
  return `M${points.map((p) => p.map((n) => n.toFixed(3)).join(' ')).join(' L')} Z`;
}
export function ribbonCenterPath(formation = 0) {
  const points = Array.from({ length: 33 }, (_, i) => ribbonPoint(i / 32, 0.5, formation));
  return `M${points.map((p) => p.map((n) => n.toFixed(3)).join(' ')).join(' L')}`;
}

export const ribbonStops = Object.freeze([
  [0, palette.blueLight],
  [0.19, palette.violet],
  [0.29, palette.deepViolet],
  [0.39, palette.lavender],
  [0.46, palette.ivory],
  [0.56, palette.lavender],
  [0.66, palette.periwinkle],
  [0.78, palette.lavender],
  [0.9, palette.violet],
  [1, palette.deepViolet],
]);

export function symbolMarkup(prefix, { variant = 'color', small = false } = {}) {
  const solid = variant === 'white' ? palette.white : variant === 'dark' ? palette.navy : undefined;
  if (solid) return `<path data-ribbon-shape="" d="${ribbonPath}" fill="${solid}"/>`;
  const gradient = `${prefix}-satin`,
    light = `${prefix}-light`,
    clip = `${prefix}-clip`;
  return `<defs>
    <linearGradient id="${gradient}" x1="20" y1="225" x2="442" y2="62" gradientUnits="userSpaceOnUse">${ribbonStops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>
    <linearGradient id="${light}" x1="0" y1="220" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="${palette.blueLight}" stop-opacity=".58"/><stop offset=".43" stop-color="${palette.periwinkle}" stop-opacity="0"/><stop offset="1" stop-color="${palette.ivory}" stop-opacity=".38"/></linearGradient>
    <clipPath id="${clip}"><path data-ribbon-clip="" d="${ribbonPath}"/></clipPath>
  </defs><g clip-path="url(#${clip})"><path data-ribbon-shape="" d="${ribbonPath}" fill="url(#${gradient})"/><path data-ribbon-shade="" d="${ribbonPath}" fill="url(#${light})"/>${small ? '' : `<path data-ribbon-edge="" d="${ribbonUpperPath}" fill="none" stroke="${palette.ivory}" stroke-opacity=".22" stroke-width="1.2"/>`}</g>`;
}
export function symbolSVG(prefix = 'morphai', options = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240" width="480" height="240" role="img" aria-label="Symbole MorphAI, M en ruban">${symbolMarkup(prefix, options)}</svg>`;
}
