# Portfolio de Paul Berdier

Portfolio Astro, nom de travail **MorphAI**. Direction **Métamorphose** : bleu nuit, violet, pervenche, lavande et ivoire ; un M en ruban donne forme à quatre expertises. La promesse d’accueil est « Vos idées prennent forme. ». Aucun client, résultat commercial ou portrait fictif.

## Lancer sous Windows / PowerShell

Prérequis : **Node 24.16 ou plus récent** (24.19 testé), npm 10 ou ultérieur. Le Node 22.15 détecté initialement satisfait Astro, mais pas les outils de lint actuels. Aucun outil global supplémentaire requis.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Ouvrir **http://127.0.0.1:4321**. La télémétrie Astro est désactivée par le lanceur du projet, sans changer de configuration globale. Aucun service distant n’est nécessaire pour les pages et démonstrateurs.

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

## Ce qui fonctionne

- Accueil, quatre offres détaillées, réalisations filtrables, deux études de cas, à propos, lab, contact, mentions, confidentialité et 404.
- Morph Engine : cinq états, avec le logo initial puis Web, Automatisation, Data et IA. Le SVG et la surface Three.js partagent leurs courbes ; le volume conserve la silhouette XY. Éclairage réactif, boutons clavier et repli SVG avant chargement ou sans WebGL.
- Logo animé : séquence de 2,8 secondes dans le hero et de 4,8 secondes en présentation. Lecture finie, pause hors écran, composition finale immédiate en mouvement réduit ou désactivé. L’atelier `/dev/brand` propose lecture, pause, reprise, progression, variantes et téléchargements ; il reste hors navigation et non indexé.
- Navigation Astro, masques typographiques, scènes SVG, progression, aperçus en profondeur, états de formulaire. Mouvement auto/réduit/désactivé, ressources nettoyées à chaque navigation.
- Lab : workflow déterministe et export JSON ; CSV éditable, nettoyage, anomalies, filtre, graphique et tableau cohérents. Données synthétiques, aucun appel métier distant.
- Contact serveur : validation, origine, quotas persistants, clé d’idempotence, enregistrement PostgreSQL avant notification Resend, reprise privée et purge par CLI.

## Une préproduction explicite

Par défaut : collecte fermée, `noindex`, robots bloqué, sitemap vide, aucun analytics. Cette livraison est vérifiée localement ; aucun déploiement Railway n’a été validé dans cette session. Les informations manquantes sont dans [la checklist de contenu](docs/content-checklist.md). Le contact est activable seulement avec les trois verrous et la configuration décrits dans [le guide de déploiement](docs/deployment.md). L’envoi réel de mail et l’infrastructure Railway nécessitent des accès autorisés ; les tests locaux n’affirment pas les avoir validés.

Le nom et les liens sont dans `src/config/brand.ts`, avec variables publiques pour les remplacer sans refonte. La palette et la signature ont leur source dans `src/brand/palette.mjs`, les courbes dans `src/brand/ribbon.mjs`. Les contenus typés sont dans `src/content/` ; les projets non publiés sont exclus des pages et du sitemap. Toute modification d’une variable publique nécessite un build.

## Identité et exports

Les références sont conservées dans `design/references/`. Les logos SVG, PNG et icônes sont dans `public/brand/` ; le favicon et l’image Open Graph sont dans `public/`. `npm run build` les régénère via le prébuild. Pour les régénérer directement :

```powershell
node --env-file-if-exists=.env scripts/generate-brand.mjs
```

Les exports vectorisent les contours par défaut de Space Grotesk avec Fontkitten, puis appliquent un épaississement optique documenté. Le logo HTML utilise Space Grotesk à la graisse 600. La signature est réservée aux grands formats ; navigation et favicons emploient une version compacte sans signature. Les règles d’usage, variantes et contrastes sont dans [design.md](docs/design.md).

Avec le build démarré localement sur le port 4322, les captures de marque se lancent ainsi :

```powershell
$env:PREVIEW_URL = 'http://127.0.0.1:4322'
node scripts/capture-brand.mjs
node scripts/capture-brand.mjs --video --square
```

Les sorties sont dans `test-results/brand/`. `--video` ajoute un WebM horizontal ; `--square` ajoute le format carré. `--mp4` demande aussi une conversion H.264 avec FFmpeg/libx264, trouvé dans `FFMPEG_PATH` ou le PATH. Le rapport indique les captures réellement produites et les conversions non disponibles. Les commandes ne constituent pas, à elles seules, une validation visuelle ou une mesure de performance ; consulter [qa.md](docs/qa.md) pour les exécutions consignées.

## Exploitation

```powershell
npm run db:migrate
npm.cmd run leads -- --help
```

Railway : un service Node + PostgreSQL, Docker multi-stage, middleware Astro et assets précompressés sur `0.0.0.0:$PORT`, santé `/api/health`. Migrations explicites, jamais au démarrage automatique. Aucun fichier local éphémère utilisé pour les prospects. Instructions de sauvegarde, de restauration et de retour arrière : [deployment.md](docs/deployment.md).

## Documentation

- [Identité et composition](docs/design.md)
- [Carte du mouvement et cycle de vie](docs/motion.md)
- [Outils, licences et sources](docs/tooling.md)
- [Vérifications réellement exécutées et limites](docs/qa.md)
- [Règles de contribution](AGENTS.md)

Les dépendances sont verrouillées dans `package-lock.json`. Les polices Space Grotesk et Manrope sont auto-hébergées (OFL). GSAP conserve sa licence propre ; les visuels SVG/Three sont créés pour ce projet.
