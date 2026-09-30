# Métamorphose — carte du mouvement

GSAP 3.15 pilote les transitions. Three.js rend uniquement le hero, via le ticker GSAP existant. Le défilement reste natif. Les contrôleurs sont `src/scripts/brand-animation.ts`, `app.ts` et `engine.ts` ; les réglages communs restent dans `src/config/motion.ts`.

## La matière devient le symbole

`src/brand/ribbon.mjs` définit deux bords de quatre courbes de Bézier dans un repère 480 × 240. Le SVG et la surface Three échantillonnent les mêmes coordonnées XY. La transformation interpole une onde fine vers ces bords, sans vectorisation raster ni remplacement par une autre silhouette à la dernière image. La progression est bornée et déterministe.

La séquence complète dure **4,8 s** : impulsion, élargissement et pli du ruban, stabilisation, révélation du nom puis signature. Le ruban atteint sa forme définitive vers 60 % de la séquence ; le nom entre entre 62 et 78 %, la signature entre 80 et 93 %, puis le cadre reste stable. La version hero utilise la même séquence en **2,8 s**. Le nom, la signature et le SVG final existent dans le HTML avant JavaScript ; les actions commerciales ne sont jamais masquées par ce contrôleur.

La page `/dev/brand`, absente de la navigation commerciale et du sitemap, propose lecture, pause, replay et une progression de 0 à 1. Elle utilise le vrai contrôleur, sans API globale de debug. Le mode présentation attend une action ; le hero joue une fois à son entrée dans l'écran. Rejouer ne crée pas un deuxième contrôleur.

## Surface expressive

Le hero possède un seul renderer et une caméra orthographique fixe. Le relief est ajouté uniquement sur Z, inférieur à 8 unités ; il ne change pas la projection de la silhouette. Maillage desktop : 160 × 10 subdivisions, soit 1 771 sommets ; mobile : 112 × 7, soit 904 sommets. Les pigments proviennent des mêmes étapes de couleur que le gradient SVG. Un matériau Phong et trois lumières locales donnent le relief satiné, sans HDR, bloom, particules permanentes, texture distante ou moteur physique.

Le rendu SVG et le rendu GPU partagent les contours mais pas un résultat pixel à pixel : le second répond à des normales, à l'éclairage et au ratio de pixels. L'orientation finale reste frontale. DPR limité à 1,5 sur ordinateur et 1,25 sur mobile.

Sur mobile, le contexte utilise `antialias: false` et laisse le navigateur choisir le GPU (`powerPreference: default`). L’ordinateur conserve le multisampling et `low-power`. La géométrie et les lumières restent identiques ; les contours sont inspectés dans les captures actives. Le drawing buffer est initialisé à sa taille utile, puis redimensionné seulement si la largeur, la hauteur ou le DPR change. Une restauration de contexte invalide cette taille mémorisée. Ce choix réduit les allocations redondantes, sans retarder artificiellement la scène ni cibler Lighthouse.

L'état initial `brand` est le logo officiel. Les boutons HTML « Le logo », Web, Automatisation, Data et IA restent accessibles au clavier. Les quatre états de service transforment la bande et jusqu'à 24 panneaux légers en interface, flux d'étapes, barres ordonnées ou documents reliés. Ces illustrations ne sont pas des variantes officielles du logo. Une sélection interrompt l'introduction ; une sélection avant la fin de l'import Three est conservée. « Le logo » ramène à la forme finale, « Rejouer » relance l'introduction.

## Autres gestes

| Zone                  | Déclencheur et effet                                                         | Durée                       |
| --------------------- | ---------------------------------------------------------------------------- | --------------------------- |
| Logo de navigation    | Éclaircissement local du satin au survol/focus, sans rejouer l'introduction  | 0,45 s                      |
| Hero                  | Soulignement dessiné et construction du ruban                                | 1,1 s / 2,8 s               |
| Titres                | Lignes masquées SplitText créées seulement à leur première entrée            | 0,85 s, décalage 0,08 s     |
| Menu mobile           | Dialog natif, liens ordonnés, Escape et focus restitué                       | 0,45 s                      |
| Scènes de services    | Interface construite, circulation, agrégation, lien entre extrait et source  | 0,65–0,85 s                 |
| Transformation métier | Étapes latérales et fragments liés au défilement avec ScrollTrigger          | 0,7–0,8 s                   |
| Projets               | Ouverture de masque, profondeur au pointeur fin, filtre et annonce du compte | 1 s / 0,5 s / 0,4 s         |
| Méthode               | Apparition des points et variation des numéros                               | 0,5–1 s                     |
| Cas                   | View Transitions Astro et progression de lecture                             | Cycle Astro / scroll passif |
| Lab                   | Calculs déterministes, étapes et graphique réellement mis à jour             | Timelines finies locales    |
| Contact               | Validation, attente HTTP, confirmation d'enregistrement ou erreur            | États DOM et CSS            |
| Boutons et footer     | Flèches et retours de contraste ; titre révélé                               | 0,2–0,85 s                  |

## Préférences et ressources

`auto` respecte `prefers-reduced-motion`. `reduced` et `off` montrent immédiatement le logo final, sans charger Three, sans grande déformation ni parallaxe. `off` supprime aussi les boucles CSS décoratives. Le choix est gardé en mémoire de session si le stockage local est interdit. Il n'existe pas de seconde préférence propre au logo.

`astro:page-load` initialise après nettoyage ; `astro:before-swap` détruit les propriétaires de la page sortante. Le code interrompt les tweens, annule les événements avec AbortController, déconnecte les observers et libère géométries, matériaux, mesh instancié et renderer. Les importations et compilations tardives vérifient que leur propriétaire existe toujours. Aucun `ScrollTrigger.killAll`.

Les révélations utilisent un IntersectionObserver commun ; les scènes masquées sur mobile ne sont pas mesurées au démarrage. La scène WebGL prépare ses shaders avec `compileAsync` lorsqu'elle approche de l'écran. Le SVG reste visible jusqu'au premier rendu confirmé. Une perte de contexte réaffiche le SVG, interrompt le moteur et invalide la compilation ; une restauration relance la préparation.

L'animation est suspendue hors écran ou dans un onglet masqué. Le ticker du renderer se retire dès qu'il n'y a plus de modification à dessiner : **aucune boucle autonome au repos**. Le mouvement de lumière au pointeur est une interpolation finie, sans déplacement de caméra. Les changements de préférence finalisent le SVG et détruisent le renderer ; ils ne laissent pas une forme intermédiaire invisible.

## Captures et budget

`scripts/capture-brand.mjs` photographie les étapes du contrôleur réel. Son option `--video --square` sérialise les SVG réellement affichés, les dessine dans un canvas local et les encode avec MediaRecorder WebM. Elle ne fabrique pas une autre animation. `--mp4` demande FFmpeg/libx264, via `FFMPEG_PATH` si nécessaire ; un outil absent est signalé, jamais simulé. Les preuves sont séparées des assets publics dans `test-results/brand` et ne sont pas toutes versionnées.

Budgets conservés : module Three ≤150 Ko gzip, script initial ≤65 Ko gzip, polices ≤55 Ko, aucune vidéo chargée automatiquement par le site. Les mesures de cette révision et les limites d'observation sont consignées dans `qa.md`. Il n'existe aucun mode spécial pour Lighthouse.
