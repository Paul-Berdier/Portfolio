# Portfolio de Paul Berdier

Site personnel français, anglais et espagnol, nom configurable MorphAI. Studio solo : écrire à la première personne. Toulouse et France à distance. Aucun client, témoignage, diplôme, résultat ou statut juridique inventé. Aucun accès aux ressources de Prooftag. Aucun secret versionné.

Paul a confirmé le 30 septembre 2026 : master Bac+5, ingénieur en automatisation des systèmes et IA, data scientist, deux ans au bureau d’études de Prooftag. Ces seuls faits sont autorisés pour cette expérience : aucune mission, école, date ou donnée professionnelle déduite. GitHub public : `https://github.com/Paul-Berdier`. Les technologies doivent rester sourcées par les projets personnels publics ; ne pas confondre présence d’un langage dans un dépôt et niveau de maîtrise.

## Langues

`src/i18n/index.ts` définit fr/en/es et les correspondances de routes : français à la racine, anglais sous `/en`, espagnol sous `/es`. Utiliser `localizePath` pour les liens publics et `getBrand` pour les textes de marque. Les pages traduites réutilisent les composants de page : éviter la duplication des mises en page. Conserver les identifiants de services, de projets et de données synthétiques ; seuls les textes visibles sont traduits. Réinitialiser les interactions dans la langue courante après navigation Astro. Les préférences de mouvement restent indépendantes de la langue. Les données de contact ne stockent pas de nouveau champ langue.

## Architecture

Astro 7, TypeScript strict, Tailwind 4, CSS de composition, GSAP et Three.js chargé à la demande. Pages éditoriales pré-rendues, API contact serveur Node, PostgreSQL. Pas de React, CMS ni moteur de scroll supplémentaire sans besoin.
`src/config/brand.ts` centralise identité et liens ; `src/content/` contient services et projets typés avec publication explicite. `src/layouts/Layout.astro` gère le cadre. `src/scripts/` gère mouvement et interactions. `src/server/` gère le contact.

## Identité Métamorphose

La direction repose sur un M en ruban, bleu nuit, violet, pervenche, lavande et ivoire. Promesse : « Vos idées prennent forme. ». `src/brand/palette.mjs` est la source canonique des pigments et de la signature ; `src/brand/ribbon.mjs` définit les courbes communes au SVG et au GPU. Utiliser les variables sémantiques CSS et garder les couleurs de succès, attention et erreur distinctes. Préserver le contraste du CTA ajusté, sans remplacer son fond par le violet brut.

Réutiliser `Mark`, `Logo` et `BrandAnimation`. Ne pas dessiner un deuxième M ni déformer la projection XY du logo dans Three.js. Les petits formats ont une correction optique dédiée et n’affichent pas la signature. Les exports vectorisés utilisent les contours réels de Space Grotesk avec un épaississement optique explicite, pas une police de remplacement. Après modification des sources, régénérer avec `node --env-file-if-exists=.env scripts/generate-brand.mjs` ou le prébuild. Ne pas éditer les exports ou `type.generated.json` à la main. Références : `design/references/` ; exports : `public/brand/` ; règles détaillées : `docs/design.md`.

## Commandes (PowerShell)

`npm ci`, `npm run dev`, `npm run check`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`, `npm start`, `npm run db:migrate`, `npm.cmd run leads -- --help`.

## Animation

Contenu visible sans JavaScript. Respecter le choix auto/reduced/off dès le premier affichage. GSAP possède les propriétés qu'il anime ; Three.js utilise le ticker GSAP. Pas de boucle hors écran ou onglet masqué. Nettoyage local de contextes, listeners, observers, ressources GPU sur `astro:before-swap` ; initialisation idempotente sur `astro:page-load`. Pas de kill global des ScrollTriggers.

Le Morph Engine comporte cinq états (`brand`, `web`, `automation`, `data`, `ai`) et démarre sur le logo. La séquence de marque dure 2,8 s dans le hero et 4,8 s en présentation ; aucun chargement ni mouvement ne doit empêcher l’accès au contenu. Réduit/off conserve le logo final immédiatement. Garder le repli SVG jusqu’au premier rendu GPU réussi et retirer le ticker lorsque la scène est stabilisée.

## Vérification

Exécuter check, lint, tests, build et Playwright. Inspecter 360, 390, 768, 1440 et 1920 px, le clavier, les modes mouvement, WebGL absent, sans JS, erreurs réseau et retour navigateur. Distinguer tests simulés, tests de vraie infrastructure et mesures de laboratoire. Ne jamais annoncer une mesure non exécutée.

Contrôler les variantes et petits formats dans `/dev/brand`, qui reste hors navigation, hors sitemap et `noindex`. La route n’est pas privée. Les captures passent par `node scripts/capture-brand.mjs` ; `--video --square` ajoute les WebM et `--mp4` nécessite FFmpeg/libx264. Les résultats vont dans `test-results/brand/`. Conserver les fonctionnalités du lab, des filtres et du contact lors des changements visuels.

## Actions externes

Préproduction par défaut, collecte et indexation désactivées. Déploiement, services facturables, publication GitHub, domaine ou accès sensibles nécessitent l'autorisation explicite de Paul. Aucun changement de configuration globale ou installation de hook. Les instructions de projet priment sur les références de design.
