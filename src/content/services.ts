import type { Locale } from '../i18n';
import { englishServices } from './services.en';
import { spanishServices } from './services.es';

export type ServiceSlug =
  'developpement-web' | 'automatisation' | 'data' | 'intelligence-artificielle';

export interface Service {
  slug: ServiceSlug;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  promise: string;
  tags: string[];
  needs: string[];
  deliverables: { title: string; description: string }[];
  approach: string;
  boundaries: string;
}

export const services: Service[] = [
  {
    slug: 'developpement-web',
    number: '01',
    title: 'Développement web',
    shortTitle: 'Web',
    description:
      'Des sites qui vous ressemblent. Des applications qui font avancer votre activité.',
    promise: 'Une idée devient un outil que l’on aime utiliser.',
    tags: ['Sites sur mesure', 'Applications', 'Outils métier', 'API'],
    needs: [
      'Votre site ne raconte plus ce que vous faites.',
      'Votre activité a grandi, vos outils n’ont pas suivi.',
      'Vous voulez transformer une idée en un premier produit utilisable.',
    ],
    deliverables: [
      {
        title: 'Sites & interfaces',
        description:
          'Un parcours clair, une identité soignée et une expérience pensée pour le mobile, le clavier et la rapidité.',
      },
      {
        title: 'Applications métier',
        description:
          'Une interface adaptée à votre façon de travailler : suivre une activité, centraliser une information, simplifier une opération.',
      },
      {
        title: 'API & intégrations',
        description:
          'Des échanges explicites entre vos logiciels, avec validation, gestion des erreurs et documentation.',
      },
    ],
    approach:
      'Je pars des usages et du contenu. Je construis ensuite une première version testable, puis j’affine l’interface et les fondations techniques avec vous.',
    boundaries:
      'Le périmètre, les navigateurs visés, l’hébergement et la maintenance sont définis au cadrage. Une application complexe se construit par étapes, avec des arbitrages explicites.',
  },
  {
    slug: 'automatisation',
    number: '02',
    title: 'Automatisation',
    shortTitle: 'Automatisation',
    description: 'Moins de copier-coller. Des outils qui se parlent et des processus qui avancent.',
    promise: 'Vos opérations répétitives trouvent leur chemin.',
    tags: ['Workflows', 'Documents', 'Intégrations', 'Traitements'],
    needs: [
      'Vous recopiez les mêmes informations dans plusieurs logiciels.',
      'Vos fichiers passent de main en main sans suivi fiable.',
      'Une tâche répétitive mobilise du temps et de l’attention.',
    ],
    deliverables: [
      {
        title: 'Processus connectés',
        description:
          'Des déclencheurs et des règles compréhensibles pour relier vos logiciels et réduire les opérations manuelles.',
      },
      {
        title: 'Documents & fichiers',
        description:
          'Des traitements pour renommer, vérifier, classer ou transformer les fichiers selon vos règles métier.',
      },
      {
        title: 'Suivi & reprise',
        description:
          'Un état visible, des erreurs exploitables et un chemin de reprise lorsqu’une étape échoue.',
      },
    ],
    approach:
      'Je cartographie le processus réel avant de l’automatiser. Nous choisissons une première boucle utile, ses exceptions et les points où une validation humaine reste nécessaire.',
    boundaries:
      'Les accès aux outils tiers, leurs quotas et leurs coûts sont étudiés avant réalisation. Une automatisation ne remplace pas un contrôle métier là où il est nécessaire.',
  },
  {
    slug: 'data',
    number: '03',
    title: 'Data & tableaux de bord',
    shortTitle: 'Data',
    description:
      'Des données éparpillées à une information claire, exploitable et utile à vos décisions.',
    promise: 'Du fichier brut à une lecture qui fait sens.',
    tags: ['Collecte', 'Pipelines', 'Analyse', 'Dashboards'],
    needs: [
      'Vos indicateurs sont dispersés dans plusieurs fichiers.',
      'Vous doutez de la qualité ou de la cohérence des données.',
      'Vous avez les chiffres, mais pas la vue d’ensemble.',
    ],
    deliverables: [
      {
        title: 'Collecte & préparation',
        description:
          'Des sources autorisées, des formats harmonisés et des règles de qualité explicites.',
      },
      {
        title: 'Pipelines de données',
        description:
          'Des transformations reproductibles et documentées, avec un suivi des entrées et des anomalies.',
      },
      {
        title: 'Tableaux de bord',
        description:
          'Des indicateurs définis ensemble, des filtres utiles et des visualisations lisibles sans mode d’emploi.',
      },
    ],
    approach:
      'Je commence par la question à laquelle les données doivent répondre. Je vérifie ensuite les sources, leur qualité et les définitions avant de construire la visualisation.',
    boundaries:
      'La qualité d’une analyse dépend de ses sources. Les données manquantes, les hypothèses et les limites sont rendues visibles ; aucun indicateur ne vaut une promesse de résultat.',
  },
  {
    slug: 'intelligence-artificielle',
    number: '04',
    title: 'Intelligence artificielle',
    shortTitle: 'IA',
    description:
      'Une IA ancrée dans vos usages, vos documents et des résultats que l’on peut vérifier.',
    promise: 'La bonne information, avec sa source.',
    tags: ['Recherche documentaire', 'Extraction', 'LLM', 'Intégration'],
    needs: [
      'Retrouver une information dans vos documents prend trop de temps.',
      'Vous voulez extraire une information avant de la faire vérifier.',
      'Vous cherchez un usage utile de l’IA, avec des limites claires.',
    ],
    deliverables: [
      {
        title: 'Recherche documentaire',
        description:
          'Une recherche sur un corpus autorisé, avec des références vers les documents utilisés.',
      },
      {
        title: 'Extraction assistée',
        description:
          'Des informations structurées à partir de documents, avec validation et traitement des cas incertains.',
      },
      {
        title: 'Intégration maîtrisée',
        description:
          'Un modèle relié à un usage précis, avec un budget d’exécution, une politique de données et des critères d’évaluation.',
      },
    ],
    approach:
      'Je vérifie d’abord qu’une approche plus simple ne suffit pas. Si l’IA apporte une valeur réelle, je construis un prototype limité et je l’évalue sur des exemples représentatifs.',
    boundaries:
      'Un modèle peut se tromper. Sources, validation humaine, confidentialité, coûts et droits d’utilisation font partie du cadrage. Aucune décision sensible n’est confiée aveuglément à un modèle.',
  },
];

export function getServices(locale: Locale): Service[] {
  if (locale === 'fr') return services;
  const copy = locale === 'es' ? spanishServices : englishServices;
  return services.map((service) => ({ ...service, ...copy[service.slug] }));
}
