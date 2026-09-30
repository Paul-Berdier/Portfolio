# Vérification — identité Métamorphose

Rapport du 30 septembre 2026 pour la branche locale `codex/morphai-ribbon`. La refonte concerne l’identité, les composants visuels et le Morph Engine. Le backend du contact conserve son fonctionnement ; collecte fermée, `noindex`, robots de préproduction et sitemap vide restent les réglages par défaut. Aucun push ni déploiement n’a été effectué.

Ce rapport remplace le bilan courant de la V1 précédente. Il distingue résultats exécutés, preuves locales, contrôles simulés et limites. Les objectifs du brief ne constituent pas des résultats de mesure.

## Environnement et résultats exécutés

Node **24.19.0**, Windows, Playwright **1.63.0**, Chrome **153.0.8010.53** headless. Chrome a été détecté dans `C:\Program Files\Google\Chrome\Application\chrome.exe` et utilisé avec un profil temporaire Playwright ; aucun profil personnel n’est lu. Vitest **5.0.2**, ESLint **10.11.0**. Les résultats de commandes ci-dessous sont ceux des exécutions locales rapportées par l’agent principal ; les captures de marque ont aussi un rapport JSON consultable.

| Vérification | Résultat et portée |
| --- | --- |
| `npm run check` | **73 fichiers, 0 erreur, 0 avertissement, 0 hint**. |
| `npm run lint` | Réussi. |
| `npm test` | **74/74 réussis** : les 66 tests existants et 8 tests de géométrie/pigments du ruban. |
| `npm run build` | Réussi ; précompression de **37 fichiers**. |
| `npm run format:check` | Réussi. |
| `npm run test:e2e` | **69/69 réussis en 2,0 minutes**, dernière relance après correction de la continuité lumineuse et réglage du GPU mobile, sur le build de production servi localement à `http://127.0.0.1:4322`, avec les réglages de préproduction. |
| `npm run test:e2e:contact` | **9/9 réussis en 1,9 minute** ; durée de commande rapportée : **119,53 s**. Serveur de test isolé à `http://127.0.0.1:4323`, base dirigée vers un port fermé, aucun email réel. |
| Captures de marque | **11 PNG et 2 WebM VP9** produits par `scripts/capture-brand.mjs` ; détail ci-dessous. |

Les fichiers `test-results/playwright/.last-run.json` et `test-results/contact/.last-run.json` indiquent `status: passed` et aucune entrée dans `failedTests`. Ils confirment l’état du dernier run, mais ne contiennent pas à eux seuls le nombre de tests ou leur durée. Le rapport HTML général est dans `playwright-report/`, les pièces jointes dans `test-results/playwright/` et `test-results/contact/`. Ces sorties sont ignorées par Git et peuvent être remplacées par une nouvelle exécution.

## Couverture vérifiée

Les **69 parcours** regroupent 43 parcours de site, 6 parcours du lab et 20 parcours de marque. Les sources sont [site.spec.ts](../tests/e2e/site.spec.ts), [lab.spec.ts](../tests/e2e/lab.spec.ts) et [brand.spec.ts](../tests/e2e/brand.spec.ts).

La couverture du site comprend les routes éditoriales, la vraie réponse 404 et le brouillon inaccessible, les liens internes, robots/sitemap, le menu mobile au clavier avec Escape et retour du focus, le lien d’évitement, les préférences de mouvement et leur persistance. Le logo initial et les quatre expertises sont commandables au clavier. Les tests observent un changement réel du canvas, cinq navigations avec historique, le repli WebGL, les titres différés puis restaurés en mouvement réduit, le contenu sans JavaScript et la navigation mobile sans JavaScript. Ils vérifient aussi les scripts retardés, les polices indisponibles, le reflow à demi-largeur, l’absence de débordement aux largeurs 360/390/768/1440/1920 px et les règles axe WCAG A/AA sélectionnées.

Le lab conserve ses six parcours : CSV/filtre/reset, erreur CSV avec conservation de la saisie, véritable export JSON, filtres de projets avec état vide IA, navigations répétées et conservation des résultats lors d’un changement de mouvement. Ses données restent synthétiques et traitées localement.

Les nouveaux parcours de marque couvrent :

- `/dev/brand` non indexé, absent du sitemap et de la navigation commerciale.
- Identifiants SVG uniques, références locales valides et absence de bitmap incorporé au SVG.
- Lecture, pause, replay, curseur et répétabilité des tracés à une même progression ; le dernier état rejoint la silhouette canonique.
- Trois replays sans multiplication observable du contrôleur ou des canvas.
- Passage au mouvement réduit pendant la transformation, mode désactivé stable, préférence système modifiée et stockage local indisponible.
- Pause et reprise lorsque la scène sort réellement de la zone visible ; suspension sur événement de visibilité masquée simulé.
- Perte d’un contexte WebGL déclenchée par `WEBGL_lose_context`, avec retour au logo SVG.
- Navigation vers un service pendant l’introduction avec chargement du module Three retardé.
- Logo complet sur mobile sans JavaScript, absence de débordement de l’atelier aux cinq largeurs et règles axe WCAG A/AA testées sur cette page.

Les huit tests de [ribbon-engine.test.ts](../tests/ribbon-engine.test.ts) vérifient les bords du maillage contre les courbes canoniques, la projection XY à plusieurs étapes, le relief borné, les progressions hors plage, les attributs finis et le budget de sommets, le déterminisme du maillage et les pigments aux arrêts du dégradé. Cette fidélité géométrique ne signifie pas que l’éclairage GPU et le dégradé SVG produisent des pixels identiques.

### Contact et stockage

La préproduction reste fermée : interface de collecte désactivée, POST direct refusé avec 503 `contact_disabled`, GET refusé avec 405 et santé disponible. Les contrôles du contact activé utilisent exclusivement le serveur isolé de test.

[contact.spec.ts](../tests/e2e-contact/contact.spec.ts) couvre neuf situations : formulaire incomplet bloqué avant requête, erreur 422 associée au champ, coupure réseau avec conservation de saisie et clé, attente de la confirmation HTTP avant succès, réponse 200 incomplète refusée, demande conservée malgré une notification échouée, stockage indisponible, changement d’animations pendant l’envoi suivi d’une reprise et présélection du besoin depuis un lien de service.

Les succès, erreurs de validation et pannes réseau de ces parcours utilisent l’interception HTTP Playwright. Le scénario de stockage appelle réellement l’API isolée, configurée vers le port fermé `127.0.0.1:1`, et observe un 503. Les clés et coordonnées sont synthétiques ; aucune demande réelle n’a été enregistrée et aucune notification email réelle n’a été envoyée.

Parmi les 66 tests existants conservés dans le total de 74, 47 concernent le backend/contact, 11 le lab/contenu et 8 le serveur HTTP statique. Onze des tests backend appliquent la migration et les requêtes SQL dans PGlite 0.5.8, moteur PostgreSQL embarqué : contraintes, transactions, quotas, expiration des clés et réservation d’une notification avec connexion sérialisée. Les autres isolent notamment stockage et transport email par injection de dépendances. Ces tests ne valident pas une infrastructure PostgreSQL distante ou une livraison Resend réelle.

## Captures et vidéos de marque

Preuve finale : [capture-report.json](../test-results/brand/capture-report.json), horodaté `2026-09-30T10:09:17.403Z` (12 h 09 min 17 s à Paris), URL `http://127.0.0.1:4322`, Chrome 153.0.8010.53. Le script source est [capture-brand.mjs](../scripts/capture-brand.mjs). Cette exécution intervient après la synchronisation de l’impulsion avec la ligne médiane du ruban.

| Sorties dans `test-results/brand/` | Résultat |
| --- | --- |
| `presentation-impulsion.png` | Progression 0,08 du véritable curseur. |
| `presentation-transformation.png` | Progression 0,38. |
| `presentation-stabilisation.png` | Progression 0,68. |
| `presentation-final.png` | Progression 1, logo final. |
| `home-reduced-{largeur}.png` | Pages entières à 360, 390, 768, 1440 et 1920 px. |
| `home-auto-390.png`, `home-auto-1440.png` | Un canvas par page ; liste `pageerror` vide dans le rapport. |
| `presentation-horizontal.webm` | VP9, 1280 × 720, **4,930 s** de lecture, 656 405 octets, sans son ; capture en 5 065 ms. |
| `presentation-square.webm` | VP9, 900 × 900, **4,933 s** de lecture, 2 937 178 octets, sans son ; capture en 5 068 ms. |

Les vidéos font progresser le contrôleur de présentation de 0 à 1, sérialisent son SVG courant puis l’enregistrent via un canvas attaché et MediaRecorder, avec émission explicite de chaque image. **151 images sont demandées**, avec une cadence cible de 30/s ; cette cadence n’est pas garantie par l’enregistreur headless. Elles représentent la présentation SVG réelle, pas une capture de la matière éclairée par le GPU. Les durées de lecture du site restent 4,8 secondes en présentation et 2,8 secondes dans le hero.

Chaque fichier final a été relu jusqu’à la fin, sans erreur de décodage, avec contrôle des dimensions et extraction à 0,5 / 2,5 / 4,7 secondes. Ces six PNG supplémentaires portent le suffixe `decoded-{temps}s.png` et sont listés dans le rapport. Le lecteur observe 77 frames totales / 19 abandonnées pour l’horizontale et 149 / 5 pour la carrée. Ces compteurs du lecteur ne sont pas un comptage indépendant des images encodées ; ils signalent une limite réelle de cette preuve vidéo. La prévisualisation du navigateur reste le support de contrôle du mouvement interactif.

Un premier export horizontal ne contenait qu’un en-tête de 110 octets. La vérification de lecture a détecté l’échec ; le script a été corrigé, puis les exports ont été remplacés. Il refuse désormais une capture vide ou un échec de lecture, borne les attentes et ne marque `status: validated` qu’après ces contrôles. Les PNG ont aussi permis de corriger le point lumineux qui se détachait initialement de son trait.

**Aucun MP4 n’a été produit : FFmpeg est absent de l’environnement utilisé.** Le script peut convertir le WebM en H.264 avec `--mp4` si FFmpeg/libx264 est disponible via `FFMPEG_PATH` ou le PATH. La production du WebM ne prouve pas une conversion MP4.

Ces sorties sont des preuves datées de rendu et de capture. Elles ne constituent ni une approbation artistique automatique, ni des baselines approuvées pour une comparaison pixel à pixel. Le comptage du canvas et l’absence de `pageerror` ne remplacent pas l’inspection du dessin, des espacements, de la lisibilité des petits formats ou de la continuité visuelle.

### Captures générales

`PREVIEW_URL=http://127.0.0.1:4322 npm run test:visual` a été exécuté sur le build de la nouvelle identité le 30 septembre 2026, avec sortie 0. Le script écrit dans `test-results/review/` cinq pages entières en mouvement réduit, deux vues actives et les poses Automatisation, Data et IA. Les cinq largeurs retournent `overflow: false`. Les poses de services ont été inspectées : flux à trois étapes, données organisées et documents reliés restent distincts. Les captures actives ne sont pas assimilées à des captures en mouvement réduit.

Après le dernier réglage GPU, cinq captures actives supplémentaires `test-results/review/engine-auto-{largeur}.png` ont été produites à 360/390/768/1440/1920 px et DPR navigateur 2. `engine-final-report.json` constate un seul canvas, aucune erreur de page et des dimensions de drawing buffer conformes aux plafonds DPR, à un pixel d’arrondi près. Les attributs réels confirment `antialias: false` / GPU `default` aux deux petites largeurs et `true` / `low-power` aux trois autres. Les captures 390 et 1440 ont été inspectées après stabilisation. Le multisampling désactivé sur mobile laisse des contours moins lissés à fort agrandissement ; il ne modifie ni les courbes ni le volume.

La recherche des anciennes valeurs `#f1814b`, `#ffa574`, `#101110`, `#191a18`, `#eeeae3` et `#aaa99e`, ainsi que des termes cuivre/graphite dans `src`, `public` et `scripts`, ne retourne plus de source active. Le blanc monochrome a été vérifié comme tracé unique `#FFFFFF`, sans dégradé. Après régénération, l’accueil, `/dev/brand`, `/api/health`, le symbole blanc, le favicon et l’image Open Graph retournent HTTP 200 avec `X-Content-Type-Options: nosniff`.

## Reproduire les contrôles

La configuration générale utilise `http://127.0.0.1:4321` par défaut. Sous Windows, Chrome installé est sélectionné s’il existe ; `PLAYWRIGHT_CHANNEL` permet de choisir un canal. Sur une machine sans Chrome, installer le navigateur de test Playwright avant exécution.

```powershell
npm run check
npm run lint
npm test
npm run build
npm run format:check
npm run test:e2e
npm run test:e2e:contact
```

Pour vérifier un build servi séparément sur le port 4322, avec les réglages de préproduction :

```powershell
$env:PORT = '4322'
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4322'
$env:PLAYWRIGHT_SERVER_COMMAND = 'node --env-file-if-exists=.env scripts/start.mjs'
node node_modules/@playwright/test/cli.js test
```

Le serveur existant est réutilisé hors CI et doit déjà être configuré en préproduction. Le serveur lancé par la configuration générale force la collecte à l’arrêt. Ne pas exécuter cette suite contre une production ou une base de prospects. Les variables ne concernent que le terminal courant ; retirer les variables `PLAYWRIGHT_*` pour revenir au serveur de développement par défaut.

Pour cibler un parcours sous PowerShell, utiliser `npm.cmd run test:e2e -- --grep "menu mobile"`. Ce choix évite l’ambiguïté rencontrée avec le shim `npm.ps1` lors du passage d’options après `--`. Le rapport HTML s’ouvre avec `npx playwright show-report`.

Avec le build local déjà démarré :

```powershell
$env:PREVIEW_URL = 'http://127.0.0.1:4322'
node scripts/capture-brand.mjs --video --square
npm run test:visual
```

## Portée et limites

- Chrome automatisé ne représente pas Safari sur iPhone ni un Android physique.
- Le conteneur Docker, Railway, le domaine et les sauvegardes distantes sont préparés mais n’ont pas été exécutés sur une infrastructure déployée.
- Le test de demi-largeur vérifie le reflow attendu à 200 %, pas le zoom natif du navigateur.
- Les scénarios de scripts retardés et de polices indisponibles simulent des dégradations ciblées ; ils ne couvrent pas tous les comportements d’une connexion lente.
- L’événement d’onglet masqué est simulé dans le test. La perte WebGL passe par une extension du navigateur ; elle ne reproduit pas tous les incidents matériels ou pilotes.
- Cinq navigations et trois replays sans duplication du canvas ni exception détectent des régressions observables ; ils ne prouvent pas l’absence absolue de fuite mémoire GPU.
- Les règles axe réussies ne remplacent pas une lecture par lecteur d’écran, une revue visuelle ou l’ensemble d’un audit d’accessibilité. Les contrôles clavier exécutés restent limités aux parcours écrits.
- Les rapports de contraste calculés dans [design.md](design.md) concernent des couples de couleurs définis ; ils ne certifient pas chaque composition ou taille de texte.
- PGlite vérifie le SQL dans un moteur PostgreSQL embarqué. La concurrence de plusieurs processus distants, une connexion à PostgreSQL déployé et une livraison email réelle ne sont pas vérifiées.
- L’échec de stockage utilise réellement un port local fermé ; les succès du contact et les notifications échouées des parcours navigateur restent simulés.
- Les PNG/WebM générés ne valent pas validation artistique de l’identité. Les petits formats, le ressenti de matière et le rythme de l’animation demandent une appréciation visuelle.
- La route `/dev/brand` est non indexée et hors navigation, mais reste accessible ; elle n’est pas une zone privée.

## Performance — mesures du build final

Dernière série complète du 30 septembre 2026 : `npm run test:performance`, Lighthouse 13.5.0, build local sur 4322, sans autre suite de tests ni capture en parallèle. Chaque audit lance un profil Chrome isolé ; la fermeture Windows de chrome-launcher 1.2.2 utilise un `taskkill` synchrone. Aucune modification du script d’audit ni détection de Lighthouse n’a été ajoutée au site.

| Mode | Performance | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: |
| Ordinateur automatique | **100** | **583 ms** | 0,00023 | 10 ms |
| Ordinateur réduit | **100** | **414 ms** | 0,00021 | 0 ms |
| Mobile automatique | **86** | **2 718 ms** | 0,00016 | 389 ms |
| Mobile réduit | **99** | **1 738 ms** | 0 | 9 ms |

Accessibilité et bonnes pratiques : **100** dans les quatre modes. SEO : **63**, notamment parce que la préproduction reste volontairement non indexable. Les rapports JSON, captures réellement issues des audits et `summary.json` sont dans `test-results/performance/`.

Le protocole utilise 1440 × 1000 à DPR 1 sur ordinateur, réseau simulé 10 240 kbit/s / RTT 40 ms et CPU ×1. Le mobile utilise 390 × 844 à DPR 2, les paramètres mobiles Lighthouse par défaut et un CPU simulé ×4. L’audit automatique charge effectivement le module moteur (111 396 octets transférés) ; le réduit ne le demande pas. Le transfert total observé est de 238 298 octets en automatique et 126 902 en réduit. Après chaque audit, une nouvelle page dans le même mode vérifie un canvas prêt en automatique et aucun canvas en réduit ; cette vérification complète la capture de l’audit, sans se substituer à elle.

### Diagnostic et variabilité

Avant l’ajustement GPU, deux audits mobiles successifs ont donné **68**, LCP 3,11–3,13 s et TBT 1 202–1 266 ms. Les premiers rapports sont conservés dans `test-results/performance/initial/`. Le profilage CDP local a isolé un appel natif `getContext` d’environ 111 ms sans ralentissement, contre moins de 2 ms par appel shader/link/render instrumenté : la création du contexte est un coût significatif, distinct de l’interpolation du ruban.

La correction supprime les redimensionnements redondants du canvas et, sur mobile, désactive le multisampling en laissant le choix du GPU au navigateur. Géométrie, lumières et durée sont conservées. Le premier audit mobile isolé après correction atteint **95**, LCP **2 568 ms**, TBT **119 ms** (`mobile-gpu-candidate.json`). La série complète finale donne **86** ; il serait trompeur de ne publier que le meilleur résultat.

**La cible mobile ≥90 et le LCP ≤2,5 s ne sont donc pas atteints de façon stable.** Le CLS reste largement sous 0,1. La création native du contexte et sa variabilité demeurent une limite de la version expressive sur cet environnement ; un travail ultérieur hors du thread principal nécessiterait une évolution du moteur et une nouvelle validation. Aucun retard artificiel de la scène, mode d’audit allégé ou suppression du canvas mobile n’a été utilisé.

Poids du build final : moteur **134 986 octets gzip** (budget 150 Ko), script principal **55 402 octets gzip** (budget 65 Ko), deux polices **47 124 octets** au total (budget 55 Ko). Le prébuild produit 9 SVG et 7 PNG ; la précompression couvre 37 fichiers. Le warning Vite sur le chunk Three brut supérieur à 500 Ko subsiste, mais son chargement reste différé et ses octets compressés respectent le budget. Sharp signale l’absence de cache Fontconfig inscriptible dans le sandbox Windows ; les fichiers générés ont été produits et inspectés.

Le TBT de laboratoire n’est pas de l’INP terrain, qui n’a pas été mesuré. Ces audits ne constituent pas une distribution statistique ni une garantie sur un téléphone physique ou Railway. Aucun résultat de l’ancienne identité n’est réutilisé comme preuve du nouveau rendu.
