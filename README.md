# Portfolio de Paul Berdier

V1 Astro du portfolio, nom de travail **MorphAI**. Direction « Instrument de précision » : graphite, cuivre, sculpture interactive et présentation de quatre expertises. Aucun client, résultat commercial ou portrait fictif.

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
- Morph Engine : 120 modules instanciés, quatre transformations, éclairage procédural, réaction au pointeur, boutons clavier. Repli SVG avant chargement ou sans WebGL.
- Navigation Astro, masques typographiques, scènes SVG, progression, aperçus en profondeur, états de formulaire. Mouvement auto/réduit/désactivé, ressources nettoyées à chaque navigation.
- Lab : workflow déterministe et export JSON ; CSV éditable, nettoyage, anomalies, filtre, graphique et tableau cohérents. Données synthétiques, aucun appel métier distant.
- Contact serveur : validation, origine, quotas persistants, clé d’idempotence, enregistrement PostgreSQL avant notification Resend, reprise privée et purge par CLI.

## Une préproduction explicite

Par défaut : collecte fermée, `noindex`, robots bloqué, sitemap vide, aucun analytics. Le site n’est pas déployé. Les informations manquantes sont dans [la checklist de contenu](docs/content-checklist.md). Le contact est activable seulement avec les trois verrous et la configuration décrits dans [le guide de déploiement](docs/deployment.md). L’envoi réel de mail et l’infrastructure Railway nécessitent des accès autorisés ; les tests locaux n’affirment pas les avoir validés.

Le nom et les liens sont dans `src/config/brand.ts`, avec variables publiques pour les remplacer sans refonte. Les contenus typés sont dans `src/content/` ; les projets non publiés sont exclus des pages et du sitemap. Toute modification d’une variable publique nécessite un build.

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
