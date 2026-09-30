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
