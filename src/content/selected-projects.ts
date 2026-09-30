import { translate, type Locale } from '../i18n';

type Copy = readonly [string, string, string];
interface SelectedProject {
  id: string;
  name: string;
  repository: string;
  source: string;
  kind: Copy;
  summary: Copy;
  role: Copy;
  scope: Copy;
  status: Copy;
  limits: Copy;
  stack: string[];
  flow: readonly [Copy, Copy, Copy];
}

/** Public repositories reviewed on 2026-09-30. No live service or client outcome implied. */
export const selectedProjects: SelectedProject[] = [
  {
    id: 'missionpilot',
    name: 'MissionPilot',
    repository: 'https://github.com/Paul-Berdier/MissionPilot',
    source: 'https://github.com/Paul-Berdier/MissionPilot/blob/codex/lot-1b-ux-donnees/README.md',
    kind: ['Projet personnel', 'Personal project', 'Proyecto personal'],
    summary: ['Un cockpit pour qualifier des opportunités freelance, suivre les missions et garder la trace des validations.', 'A workspace for qualifying freelance opportunities, following projects and keeping approval history.', 'Un espacio para cualificar oportunidades freelance, seguir proyectos y conservar el historial de aprobaciones.'],
    role: ['Conception et développement d’un outil personnel, à partir du Full Stack FastAPI Template : modèle métier, parcours de qualification et suivi des versions.', 'Design and development of a personal tool based on the Full Stack FastAPI Template: domain model, qualification workflows and version tracking.', 'Diseño y desarrollo de una herramienta personal basada en Full Stack FastAPI Template: modelo de negocio, flujos de cualificación y seguimiento de versiones.'],
    scope: ['Import manuel, clients, missions, documents versionnés, comparaison de versions et approbations explicites. Une interface React s’appuie sur une API et une base PostgreSQL.', 'Manual imports, clients, projects, versioned documents, version comparison and explicit approvals. A React interface connects to an API and PostgreSQL.', 'Importación manual, clientes, proyectos, documentos versionados, comparación de versiones y aprobaciones explícitas. Una interfaz React se conecta a una API y PostgreSQL.'],
    status: ['Implémentation locale documentée', 'Documented local implementation', 'Implementación local documentada'],
    limits: ['Pas de déploiement public ni de prospection automatique annoncés. Les agents IA et les envois externes ne font pas partie du périmètre présenté.', 'No public deployment or automated prospecting is claimed. AI agents and external sending are outside the scope presented here.', 'No se anuncia un despliegue público ni prospección automática. Los agentes de IA y los envíos externos quedan fuera del alcance presentado.'],
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'PostgreSQL', 'Docker'],
    flow: [['Opportunité', 'Opportunity', 'Oportunidad'], ['Qualification & validation', 'Qualification & approval', 'Cualificación y aprobación'], ['Mission & versions', 'Project & versions', 'Proyecto y versiones']],
  },
  {
    id: 'plumid',
    name: 'Plum’ID',
    repository: 'https://github.com/Paul-Berdier/PlumID',
    source: 'https://github.com/Paul-Berdier/PlumID/blob/main/README.md',
    kind: ['Projet collectif · backend & infrastructure', 'Team project · backend & infrastructure', 'Proyecto en equipo · backend e infraestructura'],
    summary: ['Un projet d’identification d’oiseaux à partir de photos de plumes. Ma contribution porte sur le backend, l’API et l’infrastructure.', 'A project to identify birds from feather photographs. My contribution focuses on the backend, API and infrastructure.', 'Un proyecto para identificar aves a partir de fotografías de plumas. Mi contribución se centra en el backend, la API y la infraestructura.'],
    role: ['Backend / API et infrastructure / DevOps au sein d’une équipe. Le modèle de reconnaissance et l’interface ne sont pas présentés comme mon travail individuel.', 'Backend/API and infrastructure/DevOps within a team. The recognition model and interface are not presented as my individual work.', 'Backend/API e infraestructura/DevOps dentro de un equipo. El modelo de reconocimiento y la interfaz no se presentan como trabajo individual mío.'],
    scope: ['API FastAPI, gestion des utilisateurs, espèces, plumes et photos, modèles de données et préparation Docker/Kubernetes.', 'FastAPI service, user, species, feather and photo management, data models and Docker/Kubernetes deployment configuration.', 'API FastAPI, gestión de usuarios, especies, plumas y fotos, modelos de datos y configuración de despliegue con Docker/Kubernetes.'],
    status: ['Contribution backend documentée', 'Documented backend contribution', 'Contribución backend documentada'],
    limits: ['Prototype collectif. Aucun taux de reconnaissance ni disponibilité publique du service n’est revendiqué ici.', 'A team prototype. No recognition accuracy or publicly available service is claimed here.', 'Prototipo en equipo. Aquí no se afirma ninguna precisión de reconocimiento ni disponibilidad pública del servicio.'],
    stack: ['Python', 'FastAPI', 'SQLAlchemy', 'MySQL', 'Docker', 'Kubernetes'],
    flow: [['Utilisateurs & observations', 'Users & observations', 'Usuarios y observaciones'], ['API & modèles', 'API & models', 'API y modelos'], ['Données & déploiement', 'Data & deployment', 'Datos y despliegue']],
  },
  {
    id: 'toile-dor',
    name: 'La Toile d’Or',
    repository: 'https://github.com/Paul-Berdier/La-toile-dor',
    source: 'https://github.com/Paul-Berdier/La-toile-dor/blob/main/README.md',
    kind: ['Projet personnel · communauté de jeu', 'Personal project · gaming community', 'Proyecto personal · comunidad de juego'],
    summary: ['Une application web pour organiser une communauté de jeu de rôle : invitations, rôles, missions et notifications.', 'A web application for organising a role-playing community: invitations, roles, missions and notifications.', 'Una aplicación web para organizar una comunidad de rol: invitaciones, roles, misiones y notificaciones.'],
    role: ['Conception et intégration de l’application personnelle : parcours, interface, logique métier et règles d’accès.', 'Design and integration of a personal application: workflows, interface, business logic and access rules.', 'Diseño e integración de una aplicación personal: recorridos, interfaz, lógica de negocio y reglas de acceso.'],
    scope: ['Interface Next.js/React, accès par invitation et Discord OAuth2, tableaux de missions, profils et notifications, stockage PostgreSQL et préparation Railway.', 'Next.js/React interface, invitation-based access and Discord OAuth2, mission boards, profiles and notifications, PostgreSQL storage and Railway deployment configuration.', 'Interfaz Next.js/React, acceso por invitación y Discord OAuth2, tableros de misiones, perfiles y notificaciones, almacenamiento PostgreSQL y configuración para Railway.'],
    status: ['Code public · accès applicatif privé', 'Public code · private application access', 'Código público · acceso privado a la aplicación'],
    limits: ['Tout l’univers est fictif et limité au jeu de rôle. Le dépôt public ne donne pas accès aux comptes ou données de la communauté. Ce n’est pas une mission client.', 'The entire setting is fictional and limited to role-play. The public repository does not provide access to community accounts or data. This is not a client commission.', 'Todo el universo es ficticio y se limita al juego de rol. El repositorio público no da acceso a las cuentas ni a los datos de la comunidad. No es un encargo de cliente.'],
    stack: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'Tailwind CSS', 'Playwright'],
    flow: [['Invitations & rôles', 'Invitations & roles', 'Invitaciones y roles'], ['Missions & profils', 'Missions & profiles', 'Misiones y perfiles'], ['Suivi & notifications', 'Tracking & notifications', 'Seguimiento y notificaciones']],
  },
];

export function getSelectedProjects(locale: Locale) {
  const text = (copy: Copy) => translate(locale, copy[0], copy[1], copy[2]);
  return selectedProjects.map((project) => ({
    ...project,
    kind: text(project.kind), summary: text(project.summary), role: text(project.role),
    scope: text(project.scope), status: text(project.status), limits: text(project.limits),
    flow: project.flow.map(text),
  }));
}
