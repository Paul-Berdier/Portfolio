import type { ServiceSlug } from './services';

export interface Project {
  slug: string;
  number: string;
  title: string;
  category: string;
  type: 'Démonstrateur' | 'Projet personnel' | 'Client autorisé';
  status: string;
  summary: string;
  services: ServiceSlug[];
  tags: string[];
  href: string;
  preview: 'workflow' | 'data';
  published: boolean;
  context: string;
  problem: string;
  scope: string[];
  role: string;
  solution: string;
  architecture: { title: string; description: string }[];
  result: string[];
  limits: string;
}

export const projects: Project[] = [
  {
    slug: 'flux-documents',
    number: '01',
    title: 'Du document au bon endroit.',
    category: 'Automatisation',
    type: 'Démonstrateur',
    status: 'Disponible dans le lab',
    summary:
      'Trois documents synthétiques, une règle explicite, deux destinations. Une petite mécanique que vous pouvez déclencher.',
    services: ['automatisation', 'developpement-web'],
    tags: ['Workflow local', 'Règles métier', 'JSON'],
    href: '/realisations/flux-documents',
    preview: 'workflow',
    published: true,
    context:
      'Cette expérience a été construite pour ce portfolio. Elle illustre une logique de traitement de documents avec un jeu de données synthétique, sans client ni système tiers.',
    problem:
      'Comment rendre une succession d’opérations compréhensible et montrer les exceptions, plutôt que masquer tout le traitement derrière un bouton ?',
    scope: [
      'Trois objets de données représentant des documents fictifs.',
      'Contrôle de la référence, du type et du montant.',
      'Orientation selon des règles déterministes et export JSON local.',
    ],
    role: 'Projet personnel du portfolio de Paul : cadrage de la démonstration, conception de l’interface et intégration. Le code est réalisé avec l’assistance de Codex.',
    solution:
      'Un workflow expose chaque étape et le résultat réel des règles appliquées en JavaScript. La visualisation accompagne ces opérations locales. Le téléchargement contient les données traitées, sans transmission réseau.',
    architecture: [
      { title: 'Données sources', description: 'Trois objets synthétiques intégrés à la page.' },
      {
        title: 'Validation',
        description: 'Référence présente, type « commande », montant valide.',
      },
      { title: 'Orientation', description: 'Deux éléments prêts et un élément à vérifier.' },
      { title: 'Sortie', description: 'Un fichier JSON généré dans votre navigateur.' },
    ],
    result: [
      'Les trois entrées produisent deux éléments prêts à exporter et un élément à vérifier.',
      'Le JSON exporté conserve les entrées et indique la décision de routage.',
      'Les opérations ne nécessitent aucun compte ni service externe.',
    ],
    limits:
      'Il ne s’agit pas d’un traitement réel de PDF : les noms de fichiers représentent des objets synthétiques. Aucune lecture de fichier, extraction OCR, transmission ou connexion métier n’est exécutée. Le rythme des étapes est une mise en scène du calcul local.',
  },
  {
    slug: 'atelier-data',
    number: '02',
    title: 'Des lignes. Une lecture claire.',
    category: 'Data',
    type: 'Démonstrateur',
    status: 'Disponible dans le lab',
    summary:
      'Un petit fichier imparfait devient une vue exploitable : normaliser, repérer les anomalies, filtrer et visualiser.',
    services: ['data', 'developpement-web'],
    tags: ['CSV', 'Qualité des données', 'Visualisation'],
    href: '/realisations/atelier-data',
    preview: 'data',
    published: true,
    context:
      'Un démonstrateur construit pour ce portfolio avec des montants et catégories entièrement synthétiques. Il ne représente ni une activité réelle ni des résultats commerciaux.',
    problem:
      'Un graphique peut sembler convaincant tout en cachant des entrées incohérentes. Comment rendre visibles les règles de nettoyage et ce qu’elles écartent ?',
    scope: [
      'Édition d’un CSV simple de 100 lignes maximum.',
      'Normalisation des catégories et des montants ; détection de doublons et d’entrées invalides.',
      'Filtre par catégorie, montants agrégés et tableau détaillé.',
    ],
    role: 'Projet personnel du portfolio de Paul : définition des règles, conception de la restitution et intégration. Le code est réalisé avec l’assistance de Codex.',
    solution:
      'Le traitement sépare les lignes valides, les doublons et les anomalies. Le graphique et le tableau partagent les mêmes données, et le visiteur peut modifier le fichier source pour observer l’effet des règles.',
    architecture: [
      {
        title: 'CSV éditable',
        description: 'Un jeu synthétique, délimité par des points-virgules.',
      },
      { title: 'Normalisation', description: 'Espaces, casse et séparateurs décimaux harmonisés.' },
      { title: 'Contrôle', description: 'Identifiants uniques et montants valides.' },
      { title: 'Restitution', description: 'Agrégation par catégorie et filtre interactif.' },
    ],
    result: [
      'Le jeu fourni comporte neuf lignes : six conservées, un doublon et deux anomalies.',
      'Les catégories regroupent réellement les montants des lignes retenues.',
      'Le traitement s’effectue dans le navigateur et les données saisies ne sont pas envoyées.',
    ],
    limits:
      'Ce lecteur accepte un dialecte CSV simple, sans guillemets ni champs multilignes. Il ne remplace pas un pipeline de production. Les montants illustrent le traitement et ne mesurent aucune performance commerciale.',
  },
  {
    slug: 'recherche-documentaire',
    number: '03',
    title: 'Recherche documentaire',
    category: 'IA',
    type: 'Démonstrateur',
    status: 'Brouillon non publié',
    summary: 'Piste de travail à documenter et à évaluer.',
    services: ['intelligence-artificielle'],
    tags: [],
    href: '/realisations/recherche-documentaire',
    preview: 'workflow',
    published: false,
    context: '',
    problem: '',
    scope: [],
    role: '',
    solution: '',
    architecture: [],
    result: [],
    limits: '',
  },
];

export const publishedProjects = projects.filter((project) => project.published);
