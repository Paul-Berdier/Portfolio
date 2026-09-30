import type { Locale } from '../i18n';
import { getLabMessages } from '../i18n/lab';

/** Jeux de données intégralement synthétiques, partagés entre Lab et aperçus. */
export const sampleCsv = `id;categorie;montant
001; web ;1200,00
002;DATA;850
003;automatisation;640
004;Web;900
005; data ;350,50
006;Automatisation;420
002;DATA;850
007;web;inconnu
008;;180`;

export type DataCategory = 'Web' | 'Data' | 'Automatisation';
export interface DataRow {
  id: string;
  category: DataCategory;
  amount: number;
}
export interface DataResult {
  rows: DataRow[];
  inputCount: number;
  duplicateCount: number;
  invalidCount: number;
  issues: string[];
}
const categories: Record<string, DataCategory> = {
  web: 'Web',
  data: 'Data',
  automatisation: 'Automatisation',
};
export const dataCategories: DataCategory[] = ['Web', 'Data', 'Automatisation'];

/** Dialecte volontairement limité : CSV séparé par ;, sans champs multilignes. */
export function normalizeCsv(csv: string, locale: Locale = 'fr'): DataResult {
  const messages = getLabMessages(locale);
  if (csv.length > 20_000) throw new Error(messages.csvTooLong);
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines[0]?.trim().toLowerCase() !== 'id;categorie;montant') {
    throw new Error(messages.csvHeader);
  }
  if (lines.length > 101) throw new Error(messages.csvTooManyRows);
  const seen = new Set<string>();
  const result: DataResult = {
    rows: [],
    inputCount: lines.length - 1,
    duplicateCount: 0,
    invalidCount: 0,
    issues: [],
  };
  for (const [index, line] of lines.slice(1).entries()) {
    const cells = line.split(';');
    const id = cells[0]?.trim() ?? '';
    const category = categories[cells[1]?.trim().toLowerCase() ?? ''];
    const rawAmount = cells[2]?.trim().replace(',', '.') ?? '';
    const amount = Number(rawAmount);
    if (
      cells.length !== 3 ||
      !id ||
      !category ||
      !/^\d+(\.\d{1,2})?$/.test(rawAmount) ||
      !Number.isFinite(amount) ||
      amount > 1_000_000
    ) {
      result.invalidCount += 1;
      result.issues.push(messages.invalidRow(index + 2));
    } else if (seen.has(id)) {
      result.duplicateCount += 1;
      result.issues.push(messages.duplicateRow(index + 2));
    } else {
      seen.add(id);
      result.rows.push({ id, category, amount });
    }
  }
  return result;
}

export function summarizeRows(rows: DataRow[]) {
  return dataCategories.map((category) => ({
    category,
    amount:
      Math.round(
        rows.filter((row) => row.category === category).reduce((sum, row) => sum + row.amount, 0) *
          100,
      ) / 100,
  }));
}

export const sampleData = normalizeCsv(sampleCsv);
export const sampleSummary = summarizeRows(sampleData.rows);
export const formatAmount = (value: number, locale: Locale = 'fr') =>
  new Intl.NumberFormat({ fr: 'fr-FR', en: 'en-GB', es: 'es-ES' }[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export interface SampleDocument {
  id: string;
  name: string;
  kind: string;
  amount: number;
  reference: string;
}
export interface RoutedDocument extends SampleDocument {
  destination:
    | 'Prêt à exporter'
    | 'À vérifier'
    | 'Ready to export'
    | 'Needs review'
    | 'Listo para exportar'
    | 'Requiere revisión';
  reason: string;
}
export const sampleDocuments: SampleDocument[] = [
  { id: 'DOC-001', name: 'commande-001.pdf', kind: 'commande', amount: 240, reference: 'REF-001' },
  { id: 'DOC-002', name: 'commande-002.pdf', kind: 'commande', amount: 680, reference: 'REF-002' },
  { id: 'DOC-003', name: 'note-003.pdf', kind: 'note', amount: 125, reference: '' },
];
export const workflowSteps = getLabMessages('fr').steps;

export function routeDocuments(
  documents: SampleDocument[],
  locale: Locale = 'fr',
): RoutedDocument[] {
  const messages = getLabMessages(locale);
  return documents.map((document) => {
    const valid =
      document.kind === 'commande' &&
      !!document.reference.trim() &&
      Number.isFinite(document.amount) &&
      document.amount >= 0;
    return {
      ...document,
      destination: valid ? messages.ready : messages.review,
      reason: valid ? messages.validReason : messages.reviewReason,
    };
  });
}
export const sampleRoutedDocuments = routeDocuments(sampleDocuments);
