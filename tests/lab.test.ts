import { describe, expect, it } from 'vitest';
import {
  normalizeCsv,
  sampleCsv,
  sampleData,
  summarizeRows,
  routeDocuments,
  sampleDocuments,
  formatAmount,
} from '../src/content/lab';
import { getLabMessages, labCategoryLabel } from '../src/i18n/lab';

describe('transformation CSV locale', () => {
  it('normalise le jeu fourni et signale distinctement doublons et anomalies', () => {
    const result = normalizeCsv(sampleCsv);
    expect(result.inputCount).toBe(9);
    expect(result.rows).toHaveLength(6);
    expect(result.duplicateCount).toBe(1);
    expect(result.invalidCount).toBe(2);
    expect(summarizeRows(result.rows)).toEqual([
      { category: 'Web', amount: 2100 },
      { category: 'Data', amount: 1200.5 },
      { category: 'Automatisation', amount: 1060 },
    ]);
  });
  it('garde la première entrée valide pour un identifiant', () => {
    const result = normalizeCsv('id;categorie;montant\na;web;incorrect\na; WEB ;12,30\na;data;50');
    expect(result.rows).toEqual([{ id: 'a', category: 'Web', amount: 12.3 }]);
    expect(result.invalidCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
  });
  it('refuse montants négatifs, non finis, imprécis et trop grands', () => {
    const result = normalizeCsv(
      'id;categorie;montant\na;web;-2\nb;web;Infinity\nc;data;1.123\nd;data;1000001',
    );
    expect(result.rows).toEqual([]);
    expect(result.invalidCount).toBe(4);
  });
  it('borne la taille et exige le dialecte annoncé', () => {
    expect(() => normalizeCsv('id,category,amount\n1,web,12')).toThrow('première ligne');
    expect(() => normalizeCsv('x'.repeat(20_001))).toThrow('20 000');
    expect(() =>
      normalizeCsv(
        `id;categorie;montant\n${Array.from({ length: 101 }, (_, i) => `${i};web;1`).join('\n')}`,
      ),
    ).toThrow('100 lignes');
  });
  it('agrège un filtre vide sans inventer de valeurs et accepte zéro', () => {
    expect(summarizeRows([]).every((item) => item.amount === 0)).toBe(true);
    expect(normalizeCsv('id;categorie;montant\n1;web;0').rows[0]?.amount).toBe(0);
    expect(sampleData.rows.filter((row) => row.category === 'Web')).toHaveLength(2);
  });
});

describe('routage documentaire local', () => {
  it('produit deux exports prêts et une exception sans muter la source', () => {
    const snapshot = JSON.stringify(sampleDocuments);
    const routed = routeDocuments(sampleDocuments);
    expect(routed.filter((doc) => doc.destination === 'Prêt à exporter')).toHaveLength(2);
    expect(routed.filter((doc) => doc.destination === 'À vérifier')).toHaveLength(1);
    expect(JSON.stringify(sampleDocuments)).toBe(snapshot);
  });
  it('réévalue réellement les données du scénario valide', () => {
    const routed = routeDocuments(
      sampleDocuments.map((doc) => ({
        ...doc,
        kind: 'commande',
        reference: doc.reference || 'REF-003',
      })),
    );
    expect(routed.every((doc) => doc.destination === 'Prêt à exporter')).toBe(true);
  });
  it('redirige les montants invalides vers la validation humaine', () => {
    const [document] = sampleDocuments;
    expect(routeDocuments([{ ...document!, amount: Number.NaN }])[0]?.destination).toBe(
      'À vérifier',
    );
  });
});

describe.each(['fr', 'en', 'es'] as const)('lab en %s', (locale) => {
  it('garde les calculs et identifiants du CSV, avec diagnostics localisés', () => {
    const result = normalizeCsv(sampleCsv, locale);
    const messages = getLabMessages(locale);
    expect(result.rows).toEqual(sampleData.rows);
    expect(summarizeRows(result.rows)).toEqual(summarizeRows(sampleData.rows));
    expect(result.issues).toEqual([
      messages.duplicateRow(8),
      messages.invalidRow(9),
      messages.invalidRow(10),
    ]);
    expect(() => normalizeCsv('id,category,amount', locale)).toThrow(messages.csvHeader);
    expect(() => normalizeCsv('x'.repeat(20_001), locale)).toThrow(messages.csvTooLong);
    expect(() =>
      normalizeCsv(
        `id;categorie;montant\n${Array.from({ length: 101 }, (_, index) => `${index};web;1`).join('\n')}`,
        locale,
      ),
    ).toThrow(messages.csvTooManyRows);
  });

  it('localise les décisions sans modifier les objets synthétiques exportés', () => {
    const result = routeDocuments(sampleDocuments, locale);
    const messages = getLabMessages(locale);
    expect(
      result.map(({ destination: _destination, reason: _reason, ...document }) => document),
    ).toEqual(sampleDocuments);
    expect(result.filter((document) => document.destination === messages.ready)).toHaveLength(2);
    expect(result[2]).toMatchObject({
      destination: messages.review,
      reason: messages.reviewReason,
    });
    expect(
      routeDocuments(
        sampleDocuments.map((document) => ({
          ...document,
          kind: 'commande',
          reference: document.reference || 'REF-003',
        })),
        locale,
      ).every((document) => document.destination === messages.ready),
    ).toBe(true);
  });
});

it('adapte les nombres et catégories affichées à la langue sans changer leur valeur interne', () => {
  expect(formatAmount(1200.5, 'fr')).toBe('1\u202f200,5');
  expect(formatAmount(1200.5, 'en')).toBe('1,200.5');
  expect(formatAmount(1200.5, 'es')).toBe('1200,5');
  expect(labCategoryLabel('Automatisation', 'en')).toBe('Automation');
  expect(labCategoryLabel('Automatisation', 'es')).toBe('Automatización');
  expect(labCategoryLabel('Data', 'es')).toBe('Datos');
});
