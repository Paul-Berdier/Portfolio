# Portfolio de Paul Berdier

Portfolio Astro **MorphAI**, en français, anglais et espagnol. Direction **Métamorphose** : bleu nuit, violet, pervenche, lavande et ivoire ; un M en ruban entouré d’une aurore lumineuse. La promesse d’accueil est « Vos idées prennent forme. ». Aucun client, résultat commercial ou portrait fictif.

## Lancer sous Windows / PowerShell

Prérequis : **Node 24.16 ou plus récent** (24.19 utilisé en CI), npm 10 ou ultérieur. Les dépendances restent verrouillées dans `package-lock.json`.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Ouvrir **http://127.0.0.1:4321**. Ne pas écraser un `.env` déjà configuré avec la commande de copie. La télémétrie Astro est désactivée par le lanceur du projet, sans changer de configuration globale. Aucun service distant n’est nécessaire pour les pages et démonstrateurs.

```powershell
npm run check
npm run lint
npm test
npm run test:e2e
npm run build
$env:PORT = '4322'
npm start
```

Le contrôle complémentaire `npm run test:e2e:contact` utilise un serveur local isolé et des réponses synthétiques, sans ouvrir la collecte de la préproduction. `npm run test:visual` régénère les captures. Pour mesurer le build démarré sur le port 4322 : `npm run test:performance`. La variable `PREVIEW_URL` permet de choisir une autre URL locale pour ces deux scripts. Les sources sont formatées avec Prettier (`npm run format:check`). Sous PowerShell, utiliser `npm.cmd` pour transmettre des options à un script, par exemple `npm.cmd run leads -- --help`.

Playwright utilise Chrome installé sous Windows avec un profil de test temporaire. Sur une machine sans Chrome : `npx playwright install chromium`. Les captures et traces sont dans `test-results/`, le rapport dans `playwright-report/` (ignorés par Git).

## Parcours et contenu

- Pages françaises à la racine ; traductions sous `/en` et `/es`, avec liens directs, sélecteur de langue et correspondances de routes.
- Accueil, quatre expertises, projets personnels publics, deux démonstrateurs et leurs études de cas, profil de Paul, compétences, lab, contact, mentions, confidentialité et 404.
- Profil : faits confirmés par Paul, projets et technologies documentés ; pas de niveau de maîtrise ni de résultat inventé.
- Lab : workflow déterministe et export JSON ; CSV éditable, nettoyage, anomalies, filtre, graphique et tableau cohérents. Données synthétiques, aucun appel métier distant.
- Contact serveur : validation, origine, quotas persistants, clé d’idempotence, enregistrement PostgreSQL avant notification Resend, reprise privée et purge par CLI.

## Logo et aurore

Le Morph Engine démarre sur le logo puis propose quatre démonstrations de services explicites. Le SVG et la surface Three.js partagent leurs courbes ; le volume conserve la silhouette XY. L’introduction dure 2,8 secondes dans le hero et 4,8 secondes en présentation. Le M reste stable après cette séquence.

Trois voiles SVG et une poussière lumineuse prolongent le signe, sans nouvelle dépendance ni canvas. Un bouton traduit permet de mettre l’aurore en pause ou de la reprendre. La couche s’arrête hors écran, dans un onglet masqué et dans les vues de service. Les modes réduit et désactivé n’ont aucune boucle d’ambiance. Les commandes et légendes du moteur sont dimensionnées pour la lecture.

L’atelier `/dev/brand` propose les variantes, la lecture, la pause, la reprise et les téléchargements ; il reste hors navigation et non indexé, mais ce n’est pas une route privée. Voir [les règles et tests de l’aurore](docs/aurora.md).

Les préférences de mouvement restent indépendantes de la langue. Les ressources, observers et écouteurs sont nettoyés à chaque navigation Astro.

## Préproduction et publication

Par défaut : collecte fermée, `noindex`, robots bloqué, sitemap vide, aucun analytics. Les informations manquantes sont dans [la checklist de contenu](docs/content-checklist.md). Le contact est activable seulement avec les verrous et la configuration décrits dans [le guide de déploiement](docs/deployment.md). Les tests isolés ne valident pas à eux seuls une livraison réelle de mail ni une connexion PostgreSQL distante.

Le nom et les liens sont dans `src/config/brand.ts`. La palette et la signature sont dans `src/brand/palette.mjs`, les courbes dans `src/brand/ribbon.mjs`, la géométrie d’ambiance dans `src/brand/aurora.ts`. Les textes traduits et les routes sont dans `src/i18n/` ; le profil et les contenus typés dans `src/content/`. Les projets non publiés sont exclus des pages et du sitemap. Toute modification d’une variable publique nécessite un build.

## Identité et exports

Les références sont conservées dans `design/references/`. Les logos SVG, PNG et icônes sont dans `public/brand/` ; le favicon et l’image Open Graph sont dans `public/`. `npm run build` les régénère via le prébuild. Pour les régénérer directement :

```powershell
node --env-file-if-exists=.env scripts/generate-brand.mjs
```

Les exports vectorisent les contours de Space Grotesk avec Fontkitten et un épaississement optique documenté. Le logo HTML utilise Space Grotesk à la graisse 600. La signature est réservée aux grands formats ; navigation et favicons emploient une version compacte. Les règles d’usage et contrastes sont dans [design.md](docs/design.md).

Avec le build démarré localement sur le port 4322 :

```powershell
$env:PREVIEW_URL = 'http://127.0.0.1:4322'
node scripts/capture-brand.mjs
node scripts/capture-brand.mjs --video --square
```

Les sorties sont dans `test-results/brand/`. `--video` ajoute un WebM horizontal ; `--square` ajoute le format carré ; `--mp4` nécessite FFmpeg/libx264 via `FFMPEG_PATH` ou le PATH. **Ces vidéos sérialisent le SVG du logo seul et n’incluent pas la couche d’aurore placée derrière.** Les captures des tests `aurora.spec.ts` montrent la scène complète. Aucune commande d’export ne vaut validation visuelle ou mesure de performance.

## Exploitation

```powershell
npm run db:migrate
npm.cmd run leads -- --help
```

Railway : un service Node + PostgreSQL, Docker multi-stage, middleware Astro et assets précompressés sur `0.0.0.0:$PORT`, santé `/api/health`. Migrations explicites, jamais au démarrage automatique. Aucun fichier local éphémère utilisé pour les prospects. Sauvegarde, restauration et retour arrière : [deployment.md](docs/deployment.md).

## Vérification et documentation

La CI `Portfolio quality` vérifie les types, le lint, les tests unitaires, le build, les parcours navigateur FR/EN/ES et les scénarios synthétiques de contact. Les preuves sont attachées au run GitHub Actions correspondant au commit. Les résultats historiques de `docs/qa.md` ne doivent pas être assimilés à une mesure d’une nouvelle version.

- [Identité et composition](docs/design.md)
- [Carte du mouvement et cycle de vie](docs/motion.md)
- [Aurore, budgets et contrôles](docs/aurora.md)
- [Outils, licences et sources](docs/tooling.md)
- [Vérifications historiques et limites](docs/qa.md)
- [Règles de contribution](AGENTS.md)

Les polices Space Grotesk et Manrope sont auto-hébergées (OFL). GSAP conserve sa licence propre ; les visuels SVG/Three sont créés pour ce projet.
