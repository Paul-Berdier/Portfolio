/** Decorative aurora geometry. Independent of the canonical M and deterministic. */
export const AURORA = Object.freeze({
  desktopParticles: 20,
  mobileParticles: 10,
  desktopFps: 30,
  mobileFps: 24,
  layers: 3,
});

const finiteTime = (seconds: number) => (Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
const n = (value: number) => value.toFixed(2);
const fraction = (value: number) => value - Math.floor(value);

/** Two continuous cubic edges, not a filter or a second WebGL renderer. */
export function auroraVeil(seconds: number, layer = 0) {
  const t = finiteTime(seconds) * 0.16;
  const index = Number.isFinite(layer) ? Math.max(0, Math.min(2, Math.floor(layer))) : 0;
  const phase = index * 1.75;
  const offset = index * 17;
  const a = Math.sin(t + phase) * 17;
  const b = Math.sin(t * 0.73 + phase + 1) * 22;
  const c = Math.sin(t * 0.91 + phase + 2) * 14;
  const d = Math.cos(t * 0.61 + phase) * 20;
  const edge = `M-48 ${n(225 + offset + a)} C56 ${n(283 + offset)} 100 ${n(57 + b)} 201 ${n(102 + a)} S320 ${n(246 + c)} 401 ${n(139 + b)} S570 ${n(31 + d)} 688 ${n(69 + c)}`;
  const fill = `${edge} L688 ${n(129 + offset + c)} C562 ${n(112 + d)} 473 ${n(193 + offset)} 407 ${n(207 + c)} S283 ${n(278 + offset)} 204 ${n(165 + b)} S55 ${n(331 + offset)} -48 ${n(282 + a)} Z`;
  return { edge, fill };
}

/** Sparse dust follows the luminous flow, with fades instead of flashes. */
export function auroraParticle(index: number, seconds: number) {
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const t = finiteTime(seconds);
  const u = fraction(i * 0.61803398875 + t / (31 + (i % 7) * 3));
  const depth = fraction(i * 0.41421356237);
  return {
    x: 18 + u * 604,
    y: 181 - Math.sin(u * Math.PI * 2 - 0.55) * 63 - depth * 72 + Math.sin(t * 0.2 + i) * 8,
    radius: 0.7 + depth * 0.85,
    opacity: Math.sin(u * Math.PI) ** 2 * (0.16 + depth * 0.38),
  };
}
