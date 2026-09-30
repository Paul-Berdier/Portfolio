import { translate, type Locale } from '../i18n';

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

export function getEngineModes(locale: Locale) {
  const labels = translate(
    locale,
    ['Le logo', 'Web', 'Automatisation', 'Data', 'IA'],
    ['The logo', 'Web', 'Automation', 'Data', 'AI'],
    ['El logo', 'Web', 'Automatización', 'Datos', 'IA'],
  );
  const captions = translate(
    locale,
    engineModes.map((mode) => mode.caption),
    [
      'Fluid material takes shape. An M, a signature.',
      'The ribbon opens an interface. Your ideas become a usable tool.',
      'A flow connects the steps. Tasks find their way.',
      'The material finds its order. Your data becomes readable.',
      'Documents, information and sources connect.',
    ],
    [
      'Una materia fluida toma forma. Una M, una firma.',
      'La cinta abre una interfaz. Tus ideas se convierten en una herramienta útil.',
      'Un flujo conecta las etapas. Las tareas encuentran su camino.',
      'La materia se ordena. Tus datos toman una forma legible.',
      'Documentos, información y fuentes se conectan.',
    ],
  );
  return engineModes.map((mode, index) => ({
    ...mode,
    label: labels[index]!,
    caption: captions[index]!,
  }));
}
