# Portfolio de Paul Berdier

Site personnel français, nom de travail configurable MorphAI. Studio solo : écrire « je ». Toulouse et France à distance. Aucun client, témoignage, diplôme, résultat ou statut juridique inventé. Aucun accès aux ressources de Prooftag. Aucun secret versionné.

## Architecture

Astro 7, TypeScript strict, Tailwind 4, CSS de composition, GSAP et Three.js chargé à la demande. Pages éditoriales pré-rendues, API contact serveur Node, PostgreSQL. Pas de React, CMS ni moteur de scroll supplémentaire sans besoin.
`src/config/brand.ts` centralise identité et liens ; `src/content/` contient services et projets typés avec publication explicite. `src/layouts/Layout.astro` gère le cadre. `src/scripts/` gère mouvement et interactions. `src/server/` gère le contact.

## Commandes (PowerShell)

`npm ci`, `npm run dev`, `npm run check`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`, `npm start`, `npm run db:migrate`, `npm.cmd run leads -- --help`.

## Animation

Contenu visible sans JavaScript. Respecter le choix auto/reduced/off dès le premier affichage. GSAP possède les propriétés qu'il anime ; Three.js utilise le ticker GSAP. Pas de boucle hors écran ou onglet masqué. Nettoyage local de contextes, listeners, observers, ressources GPU sur `astro:before-swap` ; initialisation idempotente sur `astro:page-load`. Pas de kill global des ScrollTriggers.

## Vérification

Exécuter check, lint, tests, build et Playwright. Inspecter 360, 390, 768, 1440 et 1920 px, le clavier, les modes mouvement, WebGL absent, sans JS, erreurs réseau et retour navigateur. Distinguer tests simulés, tests de vraie infrastructure et mesures de laboratoire. Ne jamais annoncer une mesure non exécutée.

## Actions externes

Préproduction par défaut, collecte et indexation désactivées. Déploiement, services facturables, publication GitHub, domaine ou accès sensibles nécessitent l'autorisation explicite de Paul. Aucun changement de configuration globale ou installation de hook. Les instructions de projet priment sur les références de design.
