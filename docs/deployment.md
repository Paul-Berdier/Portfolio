# Exploitation locale et Railway

## Serveur web et poids réseau

L'adaptateur Node officiel est en mode `middleware`. `scripts/start.mjs` lance un unique serveur HTTP Node, sert exclusivement `dist/client` avec sirv 3.0.2 et transmet les routes dynamiques au handler Astro. Il ne constitue pas un backend séparé. Les pages HTML sont revalidées ; les assets `_astro` portent un cache immutable. Les réponses possèdent les en-têtes de sécurité du site.

`npm run build` génère aussi l'image Open Graph puis les variantes Brotli/gzip des fichiers compressibles supérieurs à 1 KiB. Les fontes et images restent intactes. La négociation respecte `Accept-Encoding`, son poids et ses exclusions. Huit tests exécutent un véritable serveur HTTP temporaire pour vérifier compression, MIME, cache, HEAD, fallback et chemins interdits. Source : [sirv](https://github.com/lukeed/sirv/tree/main/packages/sirv).

`PUBLIC_SITE_URL` doit être HTTPS en production et rester vide en développement local. Son hôte est le seul domaine autorisé par la configuration Astro ; les origines POST et la confiance dans les en-têtes d'adresse restent deux réglages distincts. Le fichier `.env`, lorsqu'il existe, est chargé sans écraser les variables déjà injectées. La confidentialité et le formulaire lisent la même durée serveur de conservation.

Le dépôt prépare un service Node/Astro et PostgreSQL. Aucun service n’a été créé, aucun domaine acheté, aucun déploiement lancé et aucun email réel envoyé par les tests. Toute activation externe reste soumise à l’autorisation explicite de Paul.

## Local, Windows / PowerShell

Node 24.16 ou ultérieur requis (image Docker `node:24-bookworm-slim`) pour la compatibilité de toute la chaîne de vérification. Le lockfile fixe les dépendances applicatives. Le tag d’image système suit les correctifs Node 24 ; pour une reproductibilité binaire stricte, épingler un digest validé lors de la livraison en production.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
npm run check
npm run lint
npm test
npm run test:e2e
npm run test:e2e:contact
npm run build
npm start
```

La préproduction fonctionne sans base et sans secret. Les pages éditoriales sont pré-rendues ; `/contact` et `/api/contact` sont exécutés côté serveur. `/api/health` répond 200 sans requête PostgreSQL, afin qu’une panne du contact ne retire pas les pages éditoriales. Ce contrôle de vie ne vérifie ni la base ni les emails.

Les commandes `start`, `db:migrate` et `leads` chargent `.env` via Node. Astro charge les variables publiques au build ; les décisions de collecte lisent `process.env` au runtime. Pour un test de collecte local, injecter aussi les variables serveur dans le processus de développement (`node --env-file=.env scripts/astro.mjs dev`) ou, de préférence, tester le build avec `npm start`. Ne pas modifier les verrous juste pour afficher une préproduction ouverte.

## Variables et fermeture par défaut

`.env.example` ne contient aucun identifiant réel. `.env` doit rester hors Git et hors Docker.

| Variables publiques, build + runtime      | Rôle                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| `PUBLIC_BRAND_NAME`                       | Nom de travail configurable                               |
| `PUBLIC_SITE_URL`                         | Origine HTTPS définitive, canonique et sitemap            |
| `PUBLIC_SITE_MODE`                        | `preproduction` par défaut, `production` après validation |
| `PUBLIC_LEGAL_VALIDATED`                  | `false` par défaut ; validation humaine préalable         |
| `PUBLIC_CONTACT_EMAIL`                    | Adresse publique pour les coordonnées et les droits       |
| `PUBLIC_BOOKING_URL`, `PUBLIC_GITHUB_URL` | Liens réels, facultatifs                                  |

| Serveur uniquement, runtime  | Rôle                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `CONTACT_ENABLED`            | `false` par défaut ; dernier verrou de collecte                                          |
| `DATABASE_URL`               | Connexion PostgreSQL privée                                                              |
| `CONTACT_DB_SSL`             | `true` pour une connexion TLS avec certificat validé ; jamais `rejectUnauthorized:false` |
| `CONTACT_HASH_SECRET`        | Secret aléatoire d’au moins 32 caractères pour HMAC des clés et adresses                 |
| `CONTACT_ALLOWED_ORIGINS`    | Origines exactes séparées par virgule, sans chemin ni slash final                        |
| `CONTACT_RETENTION_MONTHS`   | Conservation de 1 à 36 mois, 12 par défaut, à valider                                    |
| `CONTACT_TRUSTED_PROXY_HOPS` | 0 par défaut ; nombre de proxys explicitement vérifiés                                   |
| `RESEND_API_KEY`             | Secret Resend ; un seul fournisseur                                                      |
| `CONTACT_FROM_EMAIL`         | Expéditeur réel sur domaine vérifié Resend                                               |
| `CONTACT_TO_EMAIL`           | Destinataire interne autorisé                                                            |
| `HOST`, `PORT`               | `0.0.0.0` et port Railway ; 4321 localement                                              |

La collecte exige simultanément mode production, mentions validées, activation contact, URL PostgreSQL, secret HMAC et au moins une origine valide. Une omission ferme le formulaire. Sans fournisseur email configuré, la demande est conservée en `pending` et peut être consultée en CLI : ne pas oublier cette file. Les modifications `PUBLIC_*` nécessitent un nouveau build et des valeurs runtime cohérentes. La durée de conservation est lue au runtime dans le formulaire et la confidentialité.

Générer un secret local, à placer dans le gestionnaire de secrets Railway sans le committer :

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Stockage, limitations et emails

Le serveur limite le corps à 16 KiB avant parsing, accepte JSON et formulaire URL-encodé, valide avec Zod et refuse les origines absentes ou hors liste. Honeypot, limites PostgreSQL atomiques (5 tentatives / 15 minutes / empreinte et 200 / jour globalement) et clés UUID de tentative préviennent les erreurs courantes et une partie du spam. Ce dispositif n’est pas une protection absolue contre des attaques distribuées ; aucun faux CAPTCHA n’est présent.

Par défaut `X-Forwarded-For` est ignoré. Derrière Railway, confirmer la chaîne réelle et le remplacement fiable de cet en-tête avant de fixer le nombre de proxys. Sans cette configuration, les visiteurs peuvent partager le quota de l’ingress : fermeture prudente, disponibilité à vérifier en staging. Ne pas autoriser un accès direct au processus Node qui permettrait de contourner le proxy de confiance.

Les clés de tentative sont HMACées, réservées en transaction et expirent après 24 h. Réutiliser la même clé avec un autre contenu est un conflit 409. La demande est commitée avant la notification. Statuts distincts : `pending`, `sending`, `sent`, `failed`. `sent` signifie que Resend a accepté la notification ; ce n’est pas une preuve de livraison dans la boîte du destinataire. Aucun email automatique au prospect. Une coupure côté navigateur conserve la saisie et la clé ; un nouvel essai dans les 24 h retrouve le même enregistrement.

La notification prend une réservation atomique avant son appel réseau. La CLI reprend les `sending` abandonnés depuis cinq minutes. Resend conserve les clés d’idempotence pendant 24 h ; la reprise automatique est donc conservatrice après 23 h pour les échecs déjà tentés. Vérifier la console Resend avant `retry --id ... --allow-older`. Un changement d’expéditeur/destinataire entre deux reprises peut provoquer un conflit chez Resend : conserver le contenu de notification stable pendant les tentatives.

## Migration et consultation privée

```powershell
npm run db:migrate
npm.cmd run leads -- --help
npm.cmd run leads -- list
npm.cmd run leads -- show --id UUID
npm.cmd run leads -- export --out "C:\DossierPrive\demandes.csv"
npm.cmd run leads -- retry
npm.cmd run leads -- purge
# Après examen du nombre de lignes affiché :
npm.cmd run leads -- purge --execute
```

La migration applique chaque SQL dans une transaction, avec verrou advisory et contrôle de checksum. Ne pas modifier un fichier déjà appliqué : ajouter une migration. La commande doit tourner sur le réseau autorisé avec les droits nécessaires ; aucune migration destructrice n’est exécutée au démarrage web. Utiliser un compte d’exploitation distinct si les permissions du compte applicatif sont restreintes.

`list` expose seulement références, dates, types et états. `show` et `export` exposent des données personnelles à un opérateur autorisé. Aucune route publique ne liste les demandes. L’export refuse les chemins dans le projet, refuse l’écrasement d’un fichier existant et neutralise les formules CSV. Limité à 10 000 lignes ; prévoir une sauvegarde PostgreSQL au-delà. Protéger le dossier de sortie avec les ACL Windows adaptées, chiffrer le disque et supprimer les exports après usage.

`purge` simule par défaut ; `--execute` supprime définitivement les demandes plus anciennes que la durée configurée et nettoie les clés/quota expirés. Prévoir une exécution quotidienne autorisée de cette commande ainsi qu’une reprise de notifications. Aucun planificateur externe n’a été créé. Le traitement des backups et des messages reçus dans la boîte email doit suivre une durée cohérente : la purge PostgreSQL seule ne supprime pas ces copies.

## Déploiement Railway après autorisation

1. Choisir explicitement le projet et l’environnement autorisés. Prévoir deux environnements distincts si une préproduction est nécessaire. Ne pas toucher aux projets existants non concernés.
2. Créer le service web depuis ce dépôt et une base PostgreSQL sur réseau privé. Éviter l’exposition publique de la base. Reporter les coûts au propriétaire avant création de services.
3. Renseigner les variables. Railway utilise le Dockerfile multi-stage ; les `PUBLIC_*` sont des `ARG` de build, les secrets exclusivement runtime. Le processus final utilise l’utilisateur non privilégié `node`.
4. Rester en préproduction. Générer l’URL temporaire Railway depuis l’interface autorisée ; aucune URL fictive n’est prédéfinie. Protéger l’accès si du contenu non public y est placé : `noindex` n’est pas une authentification.
5. Exécuter explicitement `npm run db:migrate` dans l’environnement privé (via une session SSH du service autorisé ou une commande de pré-déploiement configurée après validation). La configuration livrée n’exécute pas automatiquement de migration.
6. Vérifier `/api/health`, les pages, les échecs base/email et le flux complet avec des données synthétiques. Pour un test email réel autorisé, employer l’environnement et les adresses de test prévus par Resend.
7. Configurer les sauvegardes PostgreSQL, l’accès opérateur et une alerte sur les événements `contact_storage_unavailable` / `contact_notification_failed`. Les logs applicatifs n’incluent ni messages ni emails ; examiner également les logs d’infrastructure.
8. Après validation de l’identité, du statut, des mentions, des coordonnées, de la base légale, des sous-traitants, de la conservation et des droits : définir les trois verrous de production puis reconstruire. Ajouter l’origine HTTPS réellement utilisée à la liste explicite.
9. Plus tard, après autorisation du domaine : configurer DNS et certificat selon Railway, mettre à jour `PUBLIC_SITE_URL` et l’origine contact, reconstruire, vérifier canonique/sitemap et mettre en place les redirections appropriées.

## Sauvegarde, restauration et retour arrière

Avant une migration, réaliser un backup chiffré et vérifier sa restaurabilité. Dans l’environnement autorisé, utiliser les sauvegardes Railway/PostgreSQL ou `pg_dump --format=custom` avec connexion privée. Garder les secrets hors historique shell et protéger les archives. Réaliser une restauration d’essai dans une base isolée, sans envoyer de notifications, puis comparer schéma, nombre de demandes et états.

En incident : fermer `CONTACT_ENABLED`, conserver le site éditorial et figer les reprises email. Restaurer le précédent déploiement web si compatible avec le schéma. Pour une restauration de données, privilégier une nouvelle base isolée et vérifiée, puis changer `DATABASE_URL` dans l’environnement autorisé. Ne pas exécuter de `DROP`, de rollback SQL destructeur ou d’écrasement de base sans validation explicite. Après restauration, vérifier les demandes reçues depuis le backup et les emails déjà acceptés pour éviter pertes et doublons. Ouvrir de nouveau la collecte seulement après le parcours de validation.

## Sources et limites vérifiées

Consultées le 30 septembre 2026 : [adaptateur Node Astro](https://docs.astro.build/en/guides/integrations-guide/node/), [Docker sur Railway](https://docs.railway.com/builds/dockerfiles), [configuration Railway](https://docs.railway.com/config-as-code/reference), [healthchecks](https://docs.railway.com/deployments/healthchecks), [API Resend](https://resend.com/docs/api-reference/emails/send-email), [idempotence Resend](https://resend.com/docs/dashboard/emails/idempotency-keys), [INSERT PostgreSQL](https://www.postgresql.org/docs/current/sql-insert.html), [information de collecte CNIL](https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel).

Les tests unitaires injectent stockage et transport email. Une deuxième suite applique la migration réelle et les requêtes SQL dans [PGlite 0.5.8](https://pglite.dev/docs/api), moteur PostgreSQL embarqué sous licence Apache-2.0 : transactions, contraintes, clés expirées, quotas et réservation de notification. Son adaptateur utilise une seule connexion sérialisée ; il ne démontre pas la concurrence entre plusieurs processus PostgreSQL distants.

`npm run test:e2e:contact` démarre un serveur de test indépendant sur `127.0.0.1:4323` avec une configuration synthétique activée uniquement dans ce processus. Les validations UI, erreurs réseau, attentes et confirmations utilisent des réponses HTTP interceptées par Playwright. La panne du stockage appelle réellement le serveur, configuré avec une connexion vers le port fermé `127.0.0.1:1` : aucun service existant n’est utilisé. Un changement d’animations pendant l’envoi vérifie aussi que la saisie et la clé survivent et que le bouton permet une reprise. Les données restent synthétiques et le fournisseur email est explicitement désactivé. Aucun contournement de test n’existe dans le code de production.

Aucun email réel n’est envoyé. Le Dockerfile, le réseau, les migrations en service distant, les sauvegardes et la configuration de proxy doivent être exercés sur une infrastructure autorisée avant ouverture. Les résultats exacts des vérifications locales sont consignés dans `docs/qa.md`.
