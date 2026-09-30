# Vérification de la V1

Ce document distingue les vérifications exécutées, la couverture prévue et les limites. Les objectifs du brief ne constituent pas des résultats de mesure.

## Parcours automatisés

La suite `tests/e2e/site.spec.ts` est prévue pour Chromium et une préproduction locale sur `http://127.0.0.1:4321`. Sous Windows, la configuration utilise le Chrome installé dans Program Files lorsqu'il existe, avec un profil temporaire isolé créé par Playwright ; aucun profil personnel n'est lu. `PLAYWRIGHT_CHANNEL` peut sélectionner explicitement un canal. Sur une machine sans Chrome, installer le navigateur de test Playwright avant exécution. Le serveur lancé par Playwright force la collecte à l'arrêt. Si un serveur existant est réutilisé, il doit déjà être en préproduction. Ne pas exécuter cette suite contre une production ou une base de prospects.

```powershell
npm run test:e2e
npm.cmd run test:e2e -- --grep "menu mobile"
npx playwright show-report
```

Sous PowerShell, utiliser `npm.cmd` lorsqu'un script reçoit des options après `--` : le shim `npm.ps1` a transmis incorrectement l'option `--port` pendant cette session. La configuration Playwright lance directement l'exécutable JavaScript Astro pour éviter cette ambiguïté.

Pour vérifier le build servi séparément, démarrer ce serveur avec les variables de préproduction puis utiliser :

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4322'
$env:PLAYWRIGHT_SERVER_COMMAND = 'node --env-file-if-exists=.env scripts/start.mjs'
node node_modules/@playwright/test/cli.js test
```

Le port de `scripts/start.mjs` se configure avec `PORT=4322`. Ces variables ne sont modifiées que dans le terminal courant. Le serveur déjà actif est réutilisé hors CI. Supprimer les deux variables `PLAYWRIGHT_*` du terminal pour revenir au serveur de développement par défaut.

Couverture écrite : routes éditoriales, vrais statuts 404, absence du brouillon, liens internes, robots/sitemap, menu mobile au clavier et restitution du focus, lien d'évitement, préférences auto/réduit/désactivé et persistance, commandes clavier des quatre transformations, changement de rendu du canvas, cinq navigations et historique, fallback WebGL, lecture sans JavaScript et navigation sans JavaScript sur mobile, scripts retardés, polices indisponibles, absence de débordement à 360/390/768/1440/1920 px, reflow à demi-largeur, axe WCAG A/AA, collecte désactivée dans l'interface et refus direct de l'API.

Les captures d'accueil sont enregistrées dans `test-results` par test et par largeur. Ce sont des captures reproductibles en mouvement réduit, pas des baselines approuvées. La scène active est testée séparément en mode automatique. Les résultats axe sont joints au rapport HTML.

## Résultats exécutés

Le 30 septembre 2026, Playwright 1.63.0 et Chrome 153.0.8010.53 headless sous Windows, profil temporaire Playwright. Le Chromium géré par Playwright n'était pas installé ; Chrome a été détecté à `C:\Program Files\Google\Chrome\Application\chrome.exe`. Outillage complémentaire du dépôt : Vitest 5.0.2 et ESLint 10.11.0.

| Vérification | Résultat et portée |
| --- | --- |
| Découverte et exécution Playwright | 49 tests reconnus sans erreur |
| ESLint ciblé `site.spec.ts` + `playwright.config.ts` | Réussi |
| Vérification TypeScript/Astro et lint du dépôt | Réussis sur la version finale, aucun diagnostic bloquant signalé par l'agent principal |
| Tests unitaires et intégration locale | **66/66 réussis** dans le run global de l'agent principal, dont 47 backend/contact, 11 lab/contenu et 8 serveur HTTP statique |
| Suite complète sur build final de production local | **49/49 réussis en 2,9 minutes**, 43 parcours site et 6 parcours lab, serveur `http://127.0.0.1:4322`, Node 24.19.0 ; initialisation différée des révélations et shaders, ressources précompressées |
| Premier run complet développement | 36/39 réussis en 3 minutes ; les trois points ci-dessous ont ensuite été résolus et revérifiés sur le build |
| Description IA | Défaut de test corrigé : regex exigeant un mot de 10 caractères remplacée par longueur du texte complet ; parcours réussi |
| Parcours de liens | L'échec `ERR_CONNECTION_REFUSED` provenait d'un redémarrage du serveur après modification de configuration ; tous les liens vérifiés répondent sur le serveur stable |
| Débordement 360 px | Débordement réel de 9 px sur la dernière flèche du ruban d'expertises corrigé ; contrôle réussi sur les cinq pages principales |
| Axe sur accueil, services, réalisations, contact, lab | 5/5 réussis, aucune violation des règles WCAG A/AA testées |
| Scène et navigation | Canvas réellement modifié, quatre commandes clavier, préférences persistées, fallback WebGL, cinq allers-retours et historique réussis |
| Titres différés | Texte et HTML intacts hors écran ; lignes masquées créées à l'entrée, animation terminée lisible, HTML original restauré après passage en mouvement réduit |
| Layout | 360, 390, 768, 1440 et 1920 px réussis ; sans JavaScript et reflow à demi-largeur réussis |
| Dégradation ciblée | Scripts retenus puis libérés : contenu et CTA actionnable avant chargement, navigation après chargement réussie ; polices WOFF2 bloquées sans débordement 360 px ; navigation mobile sans JavaScript réussie |
| Contact préproduction | Formulaire fermé, POST direct refusé 503 `contact_disabled`, GET refusé 405, santé 200 |
| Contact activé sur serveur de test isolé | **9/9 parcours navigateur réussis en 3,6 minutes**, code de sortie 0, exécutés par l'agent backend sur `127.0.0.1:4323`, fournisseur email désactivé et données synthétiques |

Les six parcours de `tests/e2e/lab.spec.ts` sont inclus dans les 49 succès ci-dessus : CSV/filtre/reset, erreur CSV conservant la saisie, véritable export JSON, filtres projets et état vide IA, navigations répétées, préservation des résultats lors du changement de mouvement. Les 11 tests unitaires lab/contenu sont inclus dans le total de 66 tests, sans double comptage.

La suite séparée `tests/e2e-contact/contact.spec.ts` vérifie neuf situations : formulaire incomplet bloqué avant requête, erreur 422 associée au champ, coupure réseau avec conservation de saisie et clé, attente de la confirmation HTTP avant succès, réponse 200 incomplète refusée, demande conservée malgré une notification échouée, stockage réellement indisponible, changement d'animations pendant l'envoi suivi d'une reprise, présélection du besoin depuis un lien de service. Les validations serveur simulées, succès et pannes réseau de cette suite utilisent l'interception HTTP Playwright. La panne du stockage appelle réellement l'API du serveur isolé, configuré vers le port fermé `127.0.0.1:1`, et observe un 503. Le serveur temporaire a été arrêté après les essais. Aucune donnée réelle ou notification email n'a été envoyée.

Parmi les 47 tests backend inclus dans les 66 tests globaux, 11 appliquent la migration et les requêtes SQL dans PGlite 0.5.8, moteur PostgreSQL embarqué. Ils vérifient réellement contraintes, transactions, quotas, clés expirées et réservation de notification avec une connexion sérialisée. Les autres tests isolent stockage et transport email avec des dépendances injectées.

Les captures finales ont été régénérées avec `PREVIEW_URL=http://127.0.0.1:4322` et `npm run test:visual`. Elles sont dans `test-results/review` : `home-active-1440.png` (1440 × 1000), `home-active-390.png` (390 × 844), `home-reduced-360.png`, `home-reduced-390.png`, `home-reduced-768.png`, `home-reduced-1440.png`, `home-reduced-1920.png`, et les trois autres poses `engine-automation.png`, `engine-data.png`, `engine-ai.png`. Les cinq captures réduites ont confirmé l'absence de débordement. Les vues actives sont prises après `data-ready=true` et deux secondes de stabilisation. L'accueil desktop actif et la capture mobile de l'audit Lighthouse final ont été inspectés visuellement ; la revue antérieure avait aussi porté sur les pages entières desktop/mobile. Ce sont des preuves datées, pas des baselines de comparaison pixel à pixel.

## Portée et limites

- Chromium automatisé ne représente pas un iPhone/Safari ni un Android physique.
- Le conteneur Docker, Railway, le domaine et les sauvegardes distantes sont préparés mais n'ont pas été exécutés sur une infrastructure déployée.
- Le test de demi-largeur vérifie le reflow attendu à 200 %, pas le zoom natif de l'interface du navigateur.
- Le scénario de scripts retardés bloque les ressources JavaScript jusqu'à vérification du contenu initial, puis les libère. Il vérifie une dégradation ciblée, pas tous les effets d'une connexion lente. Le scénario de polices absentes intercepte et fait échouer les requêtes WOFF2.
- Cinq navigations sans duplication du canvas et sans exception détectent des régressions observables ; elles ne prouvent pas l'absence absolue de fuite mémoire GPU.
- Axe ne remplace pas une vérification clavier, une lecture par lecteur d'écran ou une revue visuelle.
- PGlite vérifie le SQL dans un moteur PostgreSQL embarqué ; la concurrence entre plusieurs processus PostgreSQL distants, une connexion à un service PostgreSQL déployé et une livraison email réelle ne sont pas vérifiées.
- L'indisponibilité de connexion au stockage est testée réellement sur un port local fermé. Les succès de contact, erreurs réseau et notifications échouées présentés par les tests navigateur restent des réponses simulées. Les interruptions média et le débit/CPU d'un appareil physique ne sont pas couverts par ces simulations.

## Performance

Objectifs : LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms lorsque la mesure est pertinente, Lighthouse mobile ≥ 90. Dernière série exécutée le **30 septembre 2026, vers 10 h 47 heure de Paris**, sur le build de production local, sans suite de tests lancée en parallèle. Lighthouse 13.5.0, Chrome 153.0.8010.53 headless sous Windows, Node 24.19.0 ; nouveau profil Chrome isolé pour chaque audit, cache froid. Script versionné : `scripts/performance.mjs`.

| Mode | Performance | LCP | CLS | TBT | Transfert total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ordinateur automatique, scène active | **100** | 584 ms | 0,00021 | 66 ms | 231 106 octets |
| Ordinateur mouvement réduit | **100** | 403 ms | 0,00021 | 0 ms | 121 540 octets |
| Mobile automatique, scène active | **92** | 2 617 ms | 0 | 186 ms | 231 106 octets |
| Mobile mouvement réduit | **99** | 1 706 ms | 0,00007 | 27 ms | 121 540 octets |

Ordinateur : 1440 × 1000, DPR 1, modèle réseau RTT 40 ms / 10 240 kbit/s, CPU ×1. Mobile : 390 × 844, DPR 2, simulation Lighthouse RTT 150 ms / 1 638,4 kbit/s, CPU ×4. La méthode est `simulate`, pas une mesure de téléphone physique. Le score d'accessibilité et celui des bonnes pratiques sont 100 pour les quatre audits ; ces résultats automatisés ne valent pas certification. Le score SEO est 63 dans cette préproduction volontairement non indexable.

L'objectif Lighthouse mobile ≥90 est atteint avec l'expérience automatique. Le LCP automatique mobile reste **117 ms au-dessus de l'objectif 2,5 s**. L'INP terrain n'est pas mesuré : le TBT de laboratoire ne doit pas être présenté comme de l'INP. Une série de quatre audits n'est pas une distribution statistique ; les performances réelles dépendent du réseau, du matériel et de l'hébergement.

Preuves : les requêtes Lighthouse chargent bien le module Three en mode automatique (109 566 octets transférés avec en-têtes) et ne le chargent pas en réduit. La capture `mobile-auto-audit.jpg`, issue de l'audit même, montre la sculpture rendue. Après chaque mesure, un contrôle Playwright dans un nouvel onglet avec le même mode média confirme un canvas prêt en automatique et aucun canvas en réduit. Les rapports JSON complets, captures d'audit et `summary.json` restent dans `test-results/performance`, ignorés par Git et régénérables.

Optimisations appliquées à tous les visiteurs : polices locales préchargées, ressources Brotli/gzip, suppression de la convolution initiale de carte d'environnement, éclairage direct, préparation asynchrone des shaders, mesure des lignes et animation des sections seulement à leur entrée dans l'écran. La série intermédiaire, avant les deux dernières optimisations, donnait 73/100, LCP 3 067 ms et TBT 793 ms sur mobile automatique. Aucun branchement spécial de l'expérience pour Lighthouse n'existe.

Le build conserve une alerte Vite pour le chunk Three brut >500 Ko ; ses 133 028 octets gzip respectent le budget de livraison. Sharp a affiché des avertissements de cache Fontconfig non accessible dans le bac à sable Windows ; l'image Open Graph a néanmoins été générée et inspectée. Ces avertissements ne sont pas cachés.
