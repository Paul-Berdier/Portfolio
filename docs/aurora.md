# MorphAI — aurore autour du M

## Périmètre

Cette évolution part de `6bfe379`, qui contient déjà les versions FR/EN/ES, le profil public, les compétences, les projets personnels et les corrections de navigation des PR #2 et #3. Ces changements sont conservés. La marque n'est pas redessinée et les paramètres de collecte/indexation ne sont pas activés par cette livraison.

## Direction et réalisation

Le M canonique est le point d'ancrage. Trois voiles SVG bleu-violet et une poussière lumineuse peu dense se déplacent derrière lui. Après l'introduction existante, le dessin du logo reste stable ; l'aurore continue de vivre. Les quatre démonstrations de service restent des commandes explicites, sans cycle automatique. L'ambiance s'efface et s'arrête dans ces vues afin de ne pas superposer deux explications.

`src/brand/aurora.ts` calcule des courbes et des positions déterministes, sans toucher à `ribbon.mjs`. `AuroraBackdrop.astro` fournit le rendu initial en HTML/SVG, avec identifiants uniques par instance. `src/scripts/aurora.ts` anime cette couche avec le ticker GSAP déjà installé. Aucun canvas, filtre plein écran, dépendance ou appel réseau supplémentaire.

Budget : trois voiles ; vingt particules sur ordinateur, dix sur petit écran ; mises à jour plafonnées à 30/s et 24/s sans modifier la fréquence globale de GSAP. Les valeurs restent éditables dans `AURORA`. Il s'agit d'un budget de réalisation, pas d'une promesse de FPS mesurés sur téléphone.

## Contrôles et cycle de vie

Un bouton FR/EN/ES permet de mettre l'ambiance en pause ou de la reprendre indépendamment du site. L'introduction reste rejouable. Les contrôles de lecture de la présentation suspendent également l'ambiance lorsqu'ils mettent la timeline en pause.

- `auto` : voiles et poussière en mouvement lorsque la scène est visible.
- `reduced` : voile très atténué et fixe, sans poussière ni boucle.
- `off` : aucun effet d'ambiance, logo normal.

Le ticker est retiré hors écran, dans un onglet masqué, pendant une pause et dans les vues de service. Les préférences existantes sont observées ; aucune seconde préférence de mouvement n'est créée. Les callbacks, observateurs et événements sont libérés sur `astro:before-swap`, puis remontés sur `astro:page-load`. Une erreur WebGL ne supprime pas cette version SVG. Sans JavaScript, le signe est présent et aucun faux bouton de pause n'apparaît.

## Vérification

Tests ajoutés : `tests/aurora.test.ts` et `tests/e2e/aurora.spec.ts`. Ils couvrent la géométrie, les budgets, le mouvement réellement observable, la stabilité du M, la pause, le hors-écran, les trois langues, le petit écran, les préférences et le rendu sans JavaScript. Les tests navigateur attachent des captures au rapport GitHub Actions. Les résultats effectifs sont ceux de la CI associée au commit ; l'existence des tests ne prouve pas leur succès.

Les exports historiques de `capture-brand.mjs` sérialisent le SVG du logo seul : ils ne capturent pas l'aurore située derrière. Pour juger l'ambiance, utiliser les captures de la scène entière et la prévisualisation du site, pas ces anciens exports vidéo. Aucun nouveau MP4 ni chiffre Lighthouse n'est revendiqué ici.

## Prévisualisation

`npm ci`, `npm run dev`, puis `/`, `/en`, `/es` et `/dev/brand`. L'aurore n'est pas un écran de chargement et ne bloque jamais le contact ou la navigation. Les commandes du moteur et les légendes utilisent désormais des tailles plus lisibles.
