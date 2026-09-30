# Contenus avant ouverture publique

## Déjà intégrés

- Identité centralisée dans `src/config/brand.ts` : Paul Berdier, Toulouse et France à distance ; nom de travail configurable.
- Direction Métamorphose : promesse « Vos idées prennent forme. », M en ruban et palette canonique dans `src/brand/`. Les offres restent explicites dès l’accueil. La signature « Donne forme à vos idées » est réservée aux formats lisibles.
- Explication courte du nom MorphAI sur la page À propos, liée à Morphée, à l’imagination et à l’adaptation des technologies. Aucun parcours personnel ajouté sans source.
- Références conservées dans `design/references/`, variantes et exports dans `public/brand/`. L’atelier `/dev/brand` permet leur contrôle et reste hors navigation, hors sitemap et non indexé.
- Quatre services typés, avec exemples d’usages, livrables, méthode et limites. Aucune offre cybersécurité.
- Deux démonstrateurs publiés : `flux-documents` et `atelier-data`. Ils fonctionnent localement avec des données synthétiques.
- Aperçus HTML rendus à partir des mêmes jeux de données que le lab ; il ne s’agit pas de photographies ni de captures de clients.
- Chaque étude de cas décrit le contexte, le périmètre, le rôle, la solution, l’architecture, les résultats calculés sur le jeu fourni et les limites.
- Une piste IA reste explicitement en brouillon. `publishedProjects` est l’unique source publique des routes et listes de réalisations.
- Aucun témoignage, client, diplôme, année d’expérience, bénéfice commercial ou résultat client n’est inventé.

## À fournir ou valider par Paul

- Nom public final et disponibilité ; domaine, adresse de contact publique et éventuel lien de rendez-vous.
- Validation de l’identité, des petits formats, de la signature et des exports avant diffusion. La reconstruction graphique et les contrôles techniques ne vérifient pas la disponibilité juridique du nom ou du signe.
- Statut réel, identité légale et informations de publication requises selon ce statut, sans déduire d’adresse personnelle.
- Coordonnées de l’hébergeur réellement retenu, prestataire d’email, lieux de traitement et éventuels transferts.
- Base légale et durée de conservation adaptées à l’activité effective ; adresse de contact pour les droits.
- Validation finale des pages mentions légales / confidentialité. Elles restent des documents préparatoires et ne deviennent pas juridiquement validées par simple changement de variable.
- Parcours professionnel, formations ou projets clients uniquement avec informations vérifiées et autorisations de publication. La page À propos se limite actuellement à l’approche et aux faits fournis.
- Si nécessaire, photographies réelles autorisées. L’illustration de la page À propos est un signe graphique, pas un portrait.

## Règles d’évolution

Un projet ne passe à `published: true` qu’après vérification du statut, des sources, des droits, des visuels et des résultats. Ne jamais publier des données clients ou des ressources professionnelles confidentielles. Les liens, coordonnées et le nom de travail restent centralisés.

Les démonstrateurs n’émettent aucune requête réseau pour traiter leurs données. Le flux documentaire représente des objets synthétiques : il ne lit aucun PDF et n’envoie aucun document. Le lecteur CSV est limité à 100 lignes, 20 000 caractères, séparateur point-virgule et champs simples sans guillemets. La nouvelle identité ne modifie pas ces limites ni le fonctionnement du contact serveur.

Après un changement du nom ou de la signature, régénérer la typographie vectorisée, les logos, les icônes et l’image Open Graph avec le prébuild. Les sources restent `src/config/brand.ts`, `src/brand/palette.mjs` et `src/brand/ribbon.mjs` ; ne pas corriger séparément un export. Vérifier les cinq états du Morph Engine, le logo final sans mouvement et la cohérence des aperçus avec le lab. Les captures et mesures effectivement exécutées sont consignées dans [qa.md](qa.md).

## Source consultée

[CNIL — Exemples de formulaire de collecte](https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel), consulté le 30 septembre 2026. Cette source décrit l’information à adapter au traitement réel ; elle ne valide pas automatiquement les notices du projet.
