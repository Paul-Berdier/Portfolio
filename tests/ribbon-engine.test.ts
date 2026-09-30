import { describe, expect, it } from 'vitest';
import { Color } from 'three';
import { edgePoint, ribbonPoint, ribbonStops } from '../src/brand/ribbon.mjs';
import { createRibbonGeometry, ribbonSurfacePoint, sampleRibbonColor } from '../src/scripts/engine';

describe('surface du ruban : fidélité géométrique au SVG canonique', () => {
  it('projette chaque bord du maillage sur les deux courbes officielles', () => {
    const segments = 160;
    const crossSegments = 10;
    const geometry = createRibbonGeometry(segments, crossSegments);
    try {
      const position = geometry.getAttribute('position');
      for (let row = 0; row <= segments; row++) {
        for (const edge of [0, 1]) {
          const vertex = row * (crossSegments + 1) + edge * crossSegments;
          const [expectedX, expectedY] = edgePoint(edge, row / segments);
          expect(position.getX(vertex) + 240).toBeCloseTo(expectedX!, 4);
          expect(120 - position.getY(vertex)).toBeCloseTo(expectedY!, 4);
        }
      }
    } finally {
      geometry.dispose();
    }
  });

  it('garde les mêmes coordonnées XY à toutes les étapes du contrôleur', () => {
    for (const formation of [0, 0.17, 0.4, 0.73, 1]) {
      for (let row = 0; row <= 80; row++) {
        for (const v of [0, 0.25, 0.5, 0.75, 1]) {
          const expected = ribbonPoint(row / 80, v, formation);
          const actual = ribbonSurfacePoint(row / 80, v, formation);
          expect(actual[0] + 240).toBeCloseTo(expected[0]!, 9);
          expect(120 - actual[1]).toBeCloseTo(expected[1]!, 9);
        }
      }
    }
  });

  it('limite le relief à moins de huit unités et aplatit l’impulsion initiale', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let row = 0; row <= 100; row++) {
      for (let column = 0; column <= 20; column++) {
        const point = ribbonSurfacePoint(row / 100, column / 20);
        min = Math.min(min, point[2]);
        max = Math.max(max, point[2]);
        expect(ribbonSurfacePoint(row / 100, column / 20, 0)[2]).toBeCloseTo(0, 10);
      }
    }
    expect(max - min).toBeLessThanOrEqual(8);
    expect(max - min).toBeGreaterThan(3);
  });

  it('borne les progressions externes sans produire de rupture de silhouette', () => {
    expect(ribbonSurfacePoint(0.4, 0.7, -3)).toEqual(ribbonSurfacePoint(0.4, 0.7, 0));
    expect(ribbonSurfacePoint(0.4, 0.7, 8)).toEqual(ribbonSurfacePoint(0.4, 0.7, 1));
  });

  it('reste un maillage de surface raisonnable avec normales et UV finies', () => {
    for (const [segments, crossSegments] of [
      [112, 7],
      [160, 10],
    ]) {
      const geometry = createRibbonGeometry(segments!, crossSegments!);
      try {
        const count = (segments! + 1) * (crossSegments! + 1);
        expect(geometry.getAttribute('position').count).toBe(count);
        expect(geometry.getAttribute('uv').count).toBe(count);
        expect(geometry.getIndex()?.count).toBe(segments! * crossSegments! * 6);
        expect(count).toBeLessThan(1800);
        for (const name of ['position', 'normal', 'uv', 'color']) {
          expect(Array.from(geometry.getAttribute(name).array).every(Number.isFinite)).toBe(true);
        }
      } finally {
        geometry.dispose();
      }
    }
  });

  it('produit le même maillage pour une capture déterministe', () => {
    const first = createRibbonGeometry();
    const second = createRibbonGeometry();
    try {
      for (const attribute of ['position', 'normal', 'uv', 'color']) {
        expect(second.getAttribute(attribute).array).toEqual(first.getAttribute(attribute).array);
      }
    } finally {
      first.dispose();
      second.dispose();
    }
  });
});

describe('pigments du moteur', () => {
  it('échantillonne exactement tous les arrêts de la palette SVG', () => {
    for (const [offset, value] of ribbonStops) {
      const actual = sampleRibbonColor(Number(offset));
      const expected = new Color(String(value));
      expect(actual.r).toBeCloseTo(expected.r, 10);
      expect(actual.g).toBeCloseTo(expected.g, 10);
      expect(actual.b).toBeCloseTo(expected.b, 10);
    }
  });

  it('borne les pigments hors plage sans ajouter une autre couleur', () => {
    expect(sampleRibbonColor(-1)).toEqual(sampleRibbonColor(0));
    expect(sampleRibbonColor(2)).toEqual(sampleRibbonColor(1));
  });
});
