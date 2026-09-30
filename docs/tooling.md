# Outils, sources et traçabilité

Vérifications du 30 septembre 2026. Les versions ci-dessous proviennent des métadonnées publiques npm consultées ce jour ; les versions effectivement installées sont celles de `package-lock.json`. Les skills sont des instructions de travail, pas des dépendances du site.

## Socle et compatibilité

Le socle a finalement été verrouillé à des versions exactes (`package.json` et lockfile). Node **24.19.0** a exécuté les vérifications ; le projet exige ≥24.16 pour la compatibilité des outils ESLint actuels, même si Astro seul accepte certaines versions 22.

La commande gratuite `21st search` via CLI **1.17.1** (MIT) a été tentée : réponse HTTP 401, aucun composant ni génération récupéré. Les skills locaux 21st-ui-build/explore ont été lus ; le brief a donné l'autorisation de retenir directement une des deux pistes, sans cérémonie supplémentaire. Aucun projet Sites n'a été créé : Railway était explicitement demandé. CUA a été tenté, mais le navigateur intégré a expiré et Chrome n'était pas disponible via ce connecteur. Les captures et parcours ont donc utilisé Playwright avec un profil Chrome temporaire isolé.

Outils de QA effectivement ajoutés au projet : Playwright **1.63.0**, axe, Vitest, **PGlite 0.5.8** (PostgreSQL embarqué, Apache-2.0), **Lighthouse 13.5.0** (Apache-2.0). La commande `npm audit` lors des installations finales a retourné zéro vulnérabilité connue. Aucun test local n'a appelé une boîte email ni un compte cloud. Sharp génère l'image Open Graph localement ; les licences des polices et de Three.js sont distribuées sous `public/licenses/`.

| Élément                             | Version stable vérifiée | Licence déclarée            | Décision                                                                                      |
| ----------------------------------- | ----------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| Astro                               | 7.3.5                   | MIT                         | Pages HTML pré-rendues et endpoints serveur                                                   |
| `@astrojs/node`                     | 11.1.6                  | MIT                         | Adaptateur officiel, mode `middleware` ; peer Astro `^7.2.1`                                  |
| Node.js                             | minimum Astro `22.12.0` | Voir distribution Node      | Node 24 retenu pour production ; Node local 22.15.0, runtime fourni 24.19.0 relevés à l'audit |
| Tailwind CSS                        | 4.3.3                   | MIT                         | Intégration Vite de la branche 4                                                              |
| GSAP                                | 3.15.0                  | GSAP Standard « no charge » | Moteur principal d'animation ; ce package n'est pas sous MIT                                  |
| Three.js                            | 0.186.1                 | MIT                         | Scène procédurale chargée séparément                                                          |
| Zod                                 | 4.6.5                   | MIT                         | Validation serveur                                                                            |
| Space Grotesk variable / Fontsource | 5.3.0                   | OFL-1.1                     | Police locale, fichiers utiles seulement                                                      |
| Manrope variable / Fontsource       | 5.3.0                   | OFL-1.1                     | Police locale fonctionnelle                                                                   |

Sources de version : [Astro](https://registry.npmjs.org/astro/latest), [Node adapter](https://registry.npmjs.org/@astrojs/node/latest), [Tailwind](https://registry.npmjs.org/tailwindcss/latest), [GSAP](https://registry.npmjs.org/gsap/latest), [Three.js](https://registry.npmjs.org/three/latest), [Zod](https://registry.npmjs.org/zod/latest), [Space Grotesk](https://registry.npmjs.org/@fontsource-variable/space-grotesk/latest), [Manrope](https://registry.npmjs.org/@fontsource-variable/manrope/latest). Les liens `latest` sont mouvants ; le tableau consigne le résultat daté.

Astro demande aussi npm `>=9.6.5`. Le mode `middleware` final utilise `node scripts/start.mjs`, le handler officiel et sirv 3.0.2 (MIT) pour les assets précompressés. `HOST` et `PORT` se règlent au démarrage. Documentation : [adaptateur Node officiel](https://docs.astro.build/en/guides/integrations-guide/node/). Le mode standalone étudié initialement ne compressait pas les réponses statiques : ce changement répond aux mesures réseau.

La navigation cliente utilise `ClientRouter`, pas l'ancien composant `ViewTransitions`. L'initialisation se fait sur `astro:page-load`, y compris aux retours navigateur ; le nettoyage de la page sortante se fait avant son remplacement, sur `astro:before-swap`. Les composants persistants doivent posséder leur propre cycle de vie. Documentation : [cycle de navigation Astro](https://docs.astro.build/en/guides/view-transitions/).

## Skills réellement consultés

### GSAP

Source officielle : [greensock/gsap-skills](https://github.com/greensock/gsap-skills), licence MIT, révision lue `aed9cfd3277740755f6bfc1155c7aa645403b760`. Les six fichiers `SKILL.md` ont été chargés en lecture par l'API publique GitHub ; aucune configuration globale n'a été copiée.

- [gsap-core](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-core/SKILL.md) : propriétés transform, contrôle des tweens, responsive et mouvement réduit.
- [gsap-timeline](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-timeline/SKILL.md) : séquences, labels et positions relatives.
- [gsap-scrolltrigger](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-scrolltrigger/SKILL.md) : déclencheurs, scrub, rafraîchissement et nettoyage.
- [gsap-plugins](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-plugins/SKILL.md) : enregistrement et sections SplitText/Flip étudiées.
- [gsap-performance](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-performance/SKILL.md) : regroupement lectures/écritures, `quickTo`, limitation des tâches simultanées.
- [gsap-utils](https://github.com/greensock/gsap-skills/blob/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-utils/SKILL.md) : sélecteurs bornés, clamp, mapping numérique.

Application au projet : contextes bornés et `revert`, une timeline pour les séquences, ScrollTrigger sur la timeline racine, pas de suppression globale des instances. Un effet possède ses propriétés. Les événements, observers et ressources Three.js demandent un nettoyage complémentaire. Le contenu reste visible sans JavaScript. Référence d'API : [documentation GSAP](https://gsap.com/docs/v3/).

La [licence du moteur GSAP](https://gsap.com/community/standard-license/) est distincte de celle des skills. Les plugins sont distribués dans le package npm public ; aucune clé GreenSock ni registre privé n'est requis.

### Impeccable

Source : [pbakaus/impeccable](https://github.com/pbakaus/impeccable), révision `0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275`, Apache-2.0. À cette révision, le [skill Codex](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/.agents/skills/impeccable/SKILL.md) indique `4.4.0` ; le package CLI indique `4.1.0` et Node `>=22.18.0`. Il ne faut pas confondre ces versions.

Consultation du skill et des références [new-work](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/skill/reference/new-work.md), [animate](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/skill/reference/animate.md), [adapt](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/skill/reference/adapt.md), [critique](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/skill/reference/critique.md), [polish](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/skill/reference/polish.md) et [optimize](https://github.com/pbakaus/impeccable/blob/0d6b47ea19b63afe15e3f93a44d5d9fbbc6fd275/skill/reference/optimize.md). Les règles de composition, d'accessibilité, d'interruption et de mesure nourrissent la réalisation ; le workflow CLI complet n'a pas été exécuté.

Le brief fourni par Paul et les décisions du projet priment sur les procédures de sélection ou les préférences esthétiques de ces références. Le contexte est lu directement dans le brief et `AGENTS.md` : le chargeur Impeccable n'a pas été installé. Le catalogue Codex de cette révision emploie `$impeccable animate`, `$impeccable adapt`, etc. Une lecture du fichier n'enregistre pas ces commandes dans l'application.

Le fichier `.codex/hooks.json` officiel et `package.json` ont été inspectés : hooks `PostToolUse` et `Stop`, lancement d'un détecteur, distributions binaires par plateforme et scripts de téléchargement/build. Aucun installateur, binaire, hook, détecteur ou serveur Impeccable n'a été activé. Aucune collecte de télémétrie Impeccable n'a été testée. Il s'agit d'une utilisation documentaire, pas d'une prétention à un audit certifié par l'outil.

Les points retenus sont : première vue distinctive et offre intelligible, alternance de densité, séquence focale propre au produit, gestes clavier/tactile, états de formulaire complets, adaptation mobile de la composition, correction prioritaire des parcours bloqués, mesures avant/après. Les effets coûteux restent bornés et interrompables. Le mode réduit préserve le retour d'état ; le mode désactivé arrête les boucles, conformément au brief.

### Installation éventuelle des skills, non exécutée

La [documentation OpenAI actuelle](https://learn.chatgpt.com/docs/build-skills) reconnaît `.agents/skills` à l'échelle du dépôt et l'invocation `$nom-du-skill`. Le [CLI skills officiel](https://github.com/vercel-labs/skills) accepte `--agent codex`, `--skill` et `--copy` ; la portée projet est le défaut, `--global` change la portée. Version npm vérifiée : `skills@1.7.0`, MIT, Node `>=22.20.0`. Le Node 22.15.0 initial ne suffit donc pas à cet outil, même s'il suffit à Astro ; utiliser Node 24 si cette installation est décidée ultérieurement.

Exemple PowerShell de sélection locale, à réexaminer avant exécution :

```powershell
$env:DISABLE_TELEMETRY = '1'
npx skills@1.7.0 add https://github.com/greensock/gsap-skills --agent codex --skill gsap-core gsap-timeline gsap-scrolltrigger gsap-plugins gsap-performance gsap-utils --copy
```

Cette commande n'a pas été exécutée. Le README du CLI indique que `DISABLE_TELEMETRY=1` ou `DO_NOT_TRACK=1` désactive télémétrie et requêtes d'audit associées. Aucun `gsap-react` n'est nécessaire à cette V1 sans React. Aucun second système de direction artistique Anthropic n'a été ajouté.

## Outils et MCP

| Capacité                                     | État à l'audit                                         | Choix                                                               |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| PowerShell, Git, npm, accès web documentaire | Disponibles                                            | Audit, code, métadonnées et documentation                           |
| CUA / navigateur intégré                     | Exposé, tentative expirée                              | Captures et parcours effectués avec Playwright                      |
| Context7 MCP                                 | Non exposé                                             | Documentation officielle directe ; pas d'installation               |
| Chrome DevTools MCP                          | Non exposé                                             | Pas de prétention à une trace DevTools MCP                          |
| Playwright MCP                               | Non exposé                                             | Tests Playwright versionnés dans le projet ; ce n'est pas le MCP    |
| Railway MCP                                  | Non exposé                                             | Configuration de déploiement et procédure, sans connexion de compte |
| Figma                                        | Capacités exposées, aucun fichier de conception fourni | Non nécessaire pour la V1                                           |
| GitHub distant                               | Aucune publication autorisée                           | Git local ; lecture de dépôts publics seulement                     |

Les outils facultatifs n'ont pas été installés pour compléter artificiellement cet inventaire. [Context7](https://github.com/upstash/context7), [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), [Playwright CLI](https://github.com/microsoft/playwright-cli), [Playwright MCP](https://github.com/microsoft/playwright-mcp) sont des sources de référence. Le README Chrome DevTools vérifié propose `--isolated` pour une session isolée et `--no-usage-statistics` pour désactiver ses statistiques d'usage, activées par défaut. Aucun profil personnel n'a été demandé.

Le [skill OpenAI Docs](https://learn.chatgpt.com/docs/build-skills) a servi à vérifier les mécanismes Codex. Les URL fournies dans le brief redirigent désormais vers ChatGPT Learn. La [documentation MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) précise la configuration `config.toml`, globale ou de projet approuvé. Aucun de ces fichiers n'a été modifié pour connecter un outil.

## Railway

La [documentation `railway mcp`](https://docs.railway.com/cli/mcp), également lue à son [URL Markdown](https://docs.railway.com/cli/mcp.md), décrit le mécanisme intégré à la CLI. Version publique vérifiée : `@railway/cli` 5.63.1, ISC. Depuis 5.44.0, `railway mcp` connecte par défaut à `mcp.railway.com` en réutilisant les identifiants `railway login`. `railway mcp local` propose le serveur embarqué ; `railway mcp install --agent codex` écrit la configuration de l'agent.

Aucune de ces commandes n'a été exécutée. L'ancien package `@railway/mcp-server` n'a pas été ajouté. Aucun compte, projet, service payant, base distante, domaine ni déploiement n'a été créé ou modifié. Les instructions de livraison doivent distinguer préparation locale et validation sur l'infrastructure autorisée.

## Limites de la recherche

Les requêtes réseau publiques par shell ont nécessité l'accès réseau autorisé de l'environnement. Les lectures `raw.githubusercontent.com` ont expiré ; l'API GitHub publique a permis de lire les mêmes fichiers, à révision fixe. Aucun token n'a été fourni. Les outils et pages évoluent : refaire ces vérifications lors d'une migration, conserver le lockfile et ne pas remplacer automatiquement les versions stables de ce projet.

## Évolution du 30 septembre 2026 — identité en ruban

La nouvelle demande retient explicitement le M en ruban, le bleu nuit, le violet et l'ivoire. Elle remplace la direction graphite/cuivre initiale. Les heuristiques des skills ne constituent pas une autorisation de revenir sur ce choix. Les lectures GSAP et Impeccable déjà tracées ci-dessus restent les références de méthode ; aucun nouveau système graphique, hook ou outil global n'a été installé.

Le code installé a été contrôlé sans changement de version : GSAP **3.15.0**, dont `MorphSVGPlugin.version`, et Three.js **0.186.1**. Context7 et Chrome DevTools MCP ne sont toujours pas exposés dans cette session ; la vérification utilise la documentation officielle et les sources livrées dans les packages verrouillés.

La transformation finale utilise une interpolation manuelle des deux bords canoniques ; MorphSVG a été consulté mais n'est pas importé dans le navigateur. Le skill local `21st-ui-build` a servi pour l'intégration dans l'existant ; aucune nouvelle génération 21st n'a été demandée, la forme et la direction étant imposées par les deux références de Paul.

**Fontkitten 1.0.3** (MIT), déjà présent dans les dépendances transitives d'Astro, a été déclaré explicitement comme outil de développement à version fixe. Ses API `create`, `glyphForCodePoint` et `path.toSVG` produisent les contours du mot-symbole à partir du WOFF2 Space Grotesk existant. L'accès aux variations WOFF2 n'a pas fonctionné dans cette version : le générateur emploie les contours par défaut et un épaississement optique documenté (42 unités pour le nom, 8 pour la signature). Il n'utilise pas une police de substitution et ne prétend pas produire exactement une instance native de graisse 600. Aucun Fontkitten n'est chargé par le navigateur ; `type.generated.json` contient les tracés générés. L'installation explicite conserve les versions du socle ; npm audit a retourné zéro vulnérabilité connue.

- [MorphSVG](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/) : enregistrement explicite du plugin, transformation de l'attribut `d`, contrôle du rapprochement avec `shapeIndex` et courbure avec `curveMode`. Le lissage qui redessine le tracé peut modifier la silhouette finale ; `redraw: false` préserve les points initiaux. Cette consultation n'implique pas l'utilisation effective du plugin si l'interpolation partagée SVG/Three suffit.
- [Progression d'une timeline](<https://gsap.com/docs/v3/GSAP/Timeline/progress()/>) et [contextes GSAP](<https://gsap.com/docs/v3/GSAP/gsap.context()/>) : la progression normalisée pilote la prévisualisation ; pause, reprise et replay réutilisent le même contrôleur. Les contextes servent au nettoyage, les événements et ressources GPU conservent leur nettoyage explicite.
- Three.js : `OrthographicCamera`, `BufferGeometry` et `BufferAttribute` ont été vérifiés dans les sources installées (`src/cameras/OrthographicCamera.js`, `src/core/BufferGeometry.js`, `src/core/BufferAttribute.js`). Projection sans changement de taille avec la profondeur, mise à jour du frustum par `updateProjectionMatrix`, attributs/index, mise à jour explicite des buffers, normales et `dispose`. Le choix `DynamicDrawUsage` précède le premier rendu. L'[index officiel Three.js](https://threejs.org/docs/) a été consulté ; ses liens individuels ont retourné 404 à l'outil de lecture, d'où le contrôle des sources exactes du package.

Avant remplacement, le build local sur `127.0.0.1:4322` a fourni quatre captures dans `test-results/before-brand` : accueil automatique et page entière en mouvement réduit, à 1440 et 390 px. Les deux pages ont répondu HTTP 200, sans exception JavaScript observée. Le navigateur Chrome utilisait un profil temporaire isolé et a été fermé après capture. `capture.json` conserve la date et les résultats ; ces preuves ne valident pas la nouvelle identité.

### Capture de la nouvelle animation

`scripts/capture-brand.mjs` pilote les contrôles réels de `/dev/brand`, sans API globale de debug ni animation parallèle. Il prévoit quatre étapes PNG, cinq largeurs en mouvement réduit et deux vues automatiques avec canvas prêt. Les exports vont sous `test-results/brand`, ignoré par Git.

```powershell
$env:PREVIEW_URL = 'http://127.0.0.1:4322'
node scripts/capture-brand.mjs
node scripts/capture-brand.mjs --video --square
```

Le mode vidéo utilise l'encodeur WebM du Chrome de test, après détection de `MediaRecorder` et VP9/VP8. Il sérialise le SVG courant du véritable contrôleur à chaque progression, conserve ses styles, intègre les fichiers de polices s'il contient du texte, puis le dessine sur un fond opaque. Le rapport indique durée effectivement écoulée, format et source ; ce rendu exporté ne mesure pas la fluidité du canvas Three. Aucun son ni transparence vidéo n'est annoncé. La capture utilise un canvas attaché et peint, puis `captureStream(0)` et `requestFrame` après chaque mise à jour du contrôleur. Elle est bornée à 25 secondes par format. Le script ne marque un fichier comme validé qu'après sa lecture complète dans un second lecteur Chrome, contrôle de ses dimensions et durée, absence d'erreur et extraction d'images à 0,5 / 2,5 / 4,7 secondes. Le rapport distingue images demandées, frames totales du lecteur et frames abandonnées : il ne promet pas une cadence constante de 30 images/s. Les résultats de la version finale sont consignés dans `docs/qa.md`.

FFmpeg/FFprobe ne sont pas disponibles dans le PATH, ni dans les emplacements ciblés du runtime fourni, du cache Playwright, de WinGet, de Scoop et des applications locales. Le fichier `ffmpeg.dll` de Docker n'est pas un encodeur en ligne de commande et n'est pas utilisé. Aucun encodeur n'a été installé. Une conversion MP4 optionnelle (`--mp4`) peut utiliser un FFmpeg autorisé déjà installé via `FFMPEG_PATH` ; le script signale explicitement l'absence de cet outil ou de `libx264`. Les étapes intermédiaires restent en mémoire, aucune série de centaines de frames n'est versionnée.

### Profilage du démarrage WebGL

La régression observée en audit mobile a été examinée avec une session CDP créée par Playwright (`Profiler.enable`, `start`, `stop`) et une instrumentation locale temporaire de `getContext` et des appels WebGL. Ce n’est pas Chrome DevTools MCP. Le profil est conservé dans `test-results/performance/engine-cpu-profile.json` ; aucune API de profilage globale n’a été ajoutée au site. La lecture de Three.js installé a aussi permis d’identifier les allocations répétées dues à `setPixelRatio` / `setSize`. Le code utilise désormais `setDrawingBufferSize` avec un garde sur les dimensions et le DPR. Les réglages GPU mobile et les mesures, y compris les variations défavorables, sont consignés dans `docs/qa.md`.
