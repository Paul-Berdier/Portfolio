import type { Locale } from '../i18n';

/** Public statements approved by Paul; evidence and exclusions: docs/profile-sources.md. */
export const profile = {
  fr: {
    title: 'À propos — Paul Berdier',
    role: 'Ingénieur en automatisation de systèmes et IA · Data scientist',
    intro: 'Je suis Paul Berdier. Je relie développement logiciel, automatisation et science des données pour transformer un besoin en outil utilisable.',
    education: 'Formation Master · Bac+5',
    experience: 'Près de 2 ans au bureau d’études de Prooftag',
    experienceDetail: 'Une expérience en alternance, au contact des besoins d’une entreprise. J’en retiens une approche concrète : comprendre le problème, construire une solution et préparer sa transmission.',
    current: 'Aujourd’hui, je développe mon activité indépendante avec MorphAI : un interlocuteur pour vos sites, applications, automatisations et projets data ou IA.',
    motivation: 'Ce qui me motive : remplacer les manipulations répétitives par des outils utiles, relier les systèmes entre eux et rendre les données compréhensibles. L’IA est une possibilité, pas une réponse imposée à chaque problème.',
    skills: 'Les outils, selon le besoin.',
    skillsIntro: 'Des langages et outils utilisés dans mes projets et mon parcours. Je choisis une stack adaptée au contexte, sans prétendre que toutes les technologies se valent pour tous les usages.',
    more: 'Desktop, jeu et outillage complémentaire',
    approach: 'Comprendre. Construire. Transmettre.',
    principles: [
      ['Partir du problème.', 'Clarifier vos usages, vos contraintes et ce qui fera une vraie différence.'],
      ['Montrer tôt.', 'Avancer avec des versions concrètes et des retours, plutôt qu’une boîte noire.'],
      ['Choisir avec raison.', 'Expliquer les choix techniques, les coûts et les limites. Réutiliser ce qui fonctionne.'],
      ['Préparer la suite.', 'Penser documentation, maintenance et autonomie dès la conception.'],
    ],
    origin: 'MorphAI évoque Morphée, les songes et les idées qui prennent forme. Ce nom exprime mon approche : adapter les technologies, dont l’IA, au travail à accomplir.',
    github: 'Explorer mon GitHub',
    work: 'Voir les projets et mon rôle',
    contact: 'Parler de votre projet',
  },
  en: {
    title: 'About — Paul Berdier',
    role: 'Systems automation and AI engineer · Data scientist',
    intro: 'I’m Paul Berdier. I combine software development, automation and data science to turn a need into a useful working tool.',
    education: 'Master’s-level education · Bac+5',
    experience: 'Nearly 2 years in Prooftag’s engineering department',
    experienceDetail: 'A work-study experience rooted in real business needs. It shaped a practical approach: understand the problem, build a solution and make it possible for others to maintain it.',
    current: 'I’m now building my independent practice with MorphAI: one point of contact for websites, applications, automation, data and AI projects.',
    motivation: 'What drives me is replacing repetitive work with useful tools, connecting systems and making data understandable. AI is an option, not the default answer to every problem.',
    skills: 'The right tools for the task.',
    skillsIntro: 'Languages and tools used across my projects and experience. I choose a stack for the context rather than treating every technology as the right answer to every need.',
    more: 'Desktop, games and additional tooling',
    approach: 'Understand. Build. Hand over.',
    principles: [
      ['Start with the problem.', 'Clarify your workflows, constraints and what will make a meaningful difference.'],
      ['Make progress visible.', 'Work with tangible versions and feedback rather than a black box.'],
      ['Choose thoughtfully.', 'Explain technical decisions, costs and limitations. Reuse what already works.'],
      ['Prepare what comes next.', 'Consider documentation, maintenance and independence from the start.'],
    ],
    origin: 'MorphAI draws on Morpheus, dreams and ideas taking shape. It expresses my approach: adapt technology, including AI, to the work that needs to be done.',
    github: 'Explore my GitHub',
    work: 'Explore the projects and my role',
    contact: 'Discuss your project',
  },
  es: {
    title: 'Sobre mí — Paul Berdier',
    role: 'Ingeniero en automatización de sistemas e IA · Científico de datos',
    intro: 'Soy Paul Berdier. Combino desarrollo de software, automatización y ciencia de datos para convertir una necesidad en una herramienta útil.',
    education: 'Formación de máster · Bac+5',
    experience: 'Casi 2 años en el departamento de ingeniería de Prooftag',
    experienceDetail: 'Una experiencia de formación en alternancia, centrada en necesidades empresariales reales. De ella nace mi enfoque práctico: entender el problema, construir una solución y facilitar su mantenimiento.',
    current: 'Ahora desarrollo mi actividad independiente con MorphAI: un único interlocutor para sitios web, aplicaciones, automatización y proyectos de datos e IA.',
    motivation: 'Me motiva sustituir tareas repetitivas por herramientas útiles, conectar sistemas y hacer comprensibles los datos. La IA es una posibilidad, no una respuesta obligatoria para cualquier problema.',
    skills: 'Las herramientas, según la necesidad.',
    skillsIntro: 'Lenguajes y herramientas utilizados en mis proyectos y mi trayectoria. Elijo la tecnología según el contexto, sin presentar todas las herramientas como adecuadas para cualquier necesidad.',
    more: 'Escritorio, videojuegos y herramientas adicionales',
    approach: 'Comprender. Construir. Transmitir.',
    principles: [
      ['Partir del problema.', 'Aclarar tus procesos, tus limitaciones y lo que marcará una diferencia real.'],
      ['Mostrar avances pronto.', 'Trabajar con versiones concretas y comentarios, no con una caja negra.'],
      ['Elegir con criterio.', 'Explicar las decisiones técnicas, los costes y los límites. Reutilizar lo que funciona.'],
      ['Preparar el futuro.', 'Pensar en documentación, mantenimiento y autonomía desde el diseño.'],
    ],
    origin: 'MorphAI evoca a Morfeo, los sueños y las ideas que toman forma. El nombre expresa mi enfoque: adaptar las tecnologías, incluida la IA, al trabajo que hay que realizar.',
    github: 'Explorar mi GitHub',
    work: 'Ver los proyectos y mi contribución',
    contact: 'Hablemos de tu proyecto',
  },
} satisfies Record<Locale, {
  title: string; role: string; intro: string; education: string; experience: string;
  experienceDetail: string; current: string; motivation: string; skills: string;
  skillsIntro: string; more: string; approach: string; principles: string[][];
  origin: string; github: string; work: string; contact: string;
}>;

export const technologyGroups = [
  { id: 'languages', titles: ['Langages', 'Languages', 'Lenguajes'], items: ['Python', 'SQL', 'Go', 'Lua', 'Java', 'TypeScript', 'JavaScript', 'HTML', 'CSS'] },
  { id: 'web', titles: ['Web & API', 'Web & APIs', 'Web y API'], items: ['FastAPI', 'Flask', 'Django', 'React', 'Next.js', 'Astro', 'Node.js', 'Express', 'Tailwind CSS'] },
  { id: 'data', titles: ['Data & automatisation', 'Data & automation', 'Datos y automatización'], items: ['pandas', 'NumPy', 'scikit-learn', 'Power BI', 'Apache Airflow', 'PostgreSQL', 'MySQL', 'SQLite'] },
  { id: 'ai', titles: ['IA & recherche documentaire', 'AI & document retrieval', 'IA y búsqueda documental'], items: ['PyTorch', 'TensorFlow', 'Keras', 'Transformers', 'LLM / RAG', 'vLLM', 'Qdrant', 'MCP'] },
  { id: 'delivery', titles: ['Déploiement & supervision', 'Deployment & monitoring', 'Despliegue y supervisión'], items: ['Git', 'GitHub', 'Docker', 'Linux', 'Kubernetes / K3s', 'Railway', 'Grafana', 'Prometheus', 'Loki'] },
  { id: 'quality', titles: ['Qualité & interfaces', 'Quality & interfaces', 'Calidad e interfaces'], items: ['pytest', 'Vitest', 'Playwright', 'Zod', 'GSAP', 'Three.js'] },
] as const;

export const additionalTechnologies = ['C++', 'QML', 'Qt', 'C#', 'Unity', 'PowerShell', 'Bash', 'CMake'];
