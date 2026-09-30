export const engineModes = [
  {
    key: 'brand',
    label: 'Le logo',
    number: '00',
    caption: 'Une matière fluide prend forme. Un M, une signature.',
  },
  {
    key: 'web',
    label: 'Web',
    number: '01',
    caption: 'Le ruban ouvre une interface. Vos idées deviennent un outil utilisable.',
  },
  {
    key: 'automation',
    label: 'Automatisation',
    number: '02',
    caption: 'Un flux relie les étapes. Les tâches trouvent leur chemin.',
  },
  {
    key: 'data',
    label: 'Data',
    number: '03',
    caption: 'La matière s’ordonne. Vos données prennent une forme lisible.',
  },
  {
    key: 'ai',
    label: 'IA',
    number: '04',
    caption: 'Documents, informations et sources entrent en relation.',
  },
] as const;
export type EngineMode = (typeof engineModes)[number]['key'];
