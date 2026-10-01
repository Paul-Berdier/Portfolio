import { describe, expect, it } from 'vitest';
import { AURORA, auroraParticle, auroraVeil } from '../src/brand/aurora';

describe('aurora geometry', () => {
  it('is deterministic, so visual reviews can reproduce the same frame', () => {
    expect(auroraVeil(12, 1)).toEqual(auroraVeil(12, 1));
    expect(auroraParticle(7, 12)).toEqual(auroraParticle(7, 12));
  });
  it('moves the ambience without modifying the canonical logo', () => {
    expect(auroraVeil(12).fill).not.toBe(auroraVeil(0).fill);
    expect(auroraVeil(12).edge).not.toBe(auroraVeil(0).edge);
    expect(auroraParticle(0, 12).x).not.toBe(auroraParticle(0, 0).x);
  });
  it('emits closed fills and open edges with finite coordinates', () => {
    for (const time of [0, 0.01, 4.8, 60, 3600, Number.NaN, Number.POSITIVE_INFINITY]) {
      for (const layer of [0, 1, 2, -1, 100, Number.NaN]) {
        const shape = auroraVeil(time, layer);
        expect(shape.fill).toMatch(/^M.* Z$/);
        expect(shape.edge).toMatch(/^M/);
        expect(shape.fill + shape.edge).not.toMatch(/NaN|Infinity/);
      }
    }
  });
  it('uses a small bounded particle budget', () => {
    expect(AURORA.desktopParticles).toBeLessThanOrEqual(20);
    expect(AURORA.mobileParticles).toBeLessThan(AURORA.desktopParticles);
    expect(AURORA.mobileFps).toBeLessThanOrEqual(30);
  });
  it('keeps dust subtle and inside the drawing area', () => {
    for (let i = 0; i < AURORA.desktopParticles; i++) {
      for (const time of [0, 1, 15, 60, 3600, Number.NaN]) {
        const point = auroraParticle(i, time);
        expect(Object.values(point).every(Number.isFinite)).toBe(true);
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(640);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(320);
        expect(point.opacity).toBeGreaterThanOrEqual(0);
        expect(point.opacity).toBeLessThan(0.55);
        expect(point.radius).toBeLessThan(1.6);
      }
    }
  });
});
