# Métamorphose

Une matière fluide qui prend forme : le portfolio associe une composition éditoriale bleu nuit à un M en ruban satiné. La promesse d’accueil est « Vos idées prennent forme. » ; les offres restent explicites : sites, applications, automatisation, data et intelligence artificielle. La signature de marque est « Donne forme à vos idées ».

MorphAI reste le nom de travail configurable dans `src/config/brand.ts`. La page À propos relie brièvement ce nom à Morphée, à l’imagination et à des technologies adaptées au besoin réel. Les faits personnels restent limités aux informations fournies par Paul.

## Sources de l’identité

| Source                                | Rôle                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `src/brand/palette.mjs`               | Pigments canoniques, couleurs d’état et signature.                                |
| `src/brand/ribbon.mjs`                | Deux bords en courbes de Bézier, silhouette SVG, dégradé et déformation du ruban. |
| `src/brand/type.generated.json`       | Contours typographiques générés pour l’animation et les exports.                  |
| `src/components/Mark.astro`           | Symbole seul, variantes couleur, blanc pur et bleu nuit.                          |
| `src/components/Logo.astro`           | Assemblage du symbole, du nom et de la signature facultative.                     |
| `src/components/BrandAnimation.astro` | Composition SVG partagée entre hero et présentation.                              |
| `scripts/generate-brand.mjs`          | Régénération des exports, icônes, typographie vectorisée et image Open Graph.     |

Les références fournies sont conservées dans `design/references/morphai-logo-reference.png` et `design/references/morphai-animation-storyboard.png`. Elles guident la reconstruction ; les formes de production viennent des courbes du dépôt. Le symbole n’est pas une image matricielle tracée à chaque affichage.

## Couleurs et lisibilité

`Layout.astro` expose les pigments sous la forme `--brand-*`. Les composants utilisent les alias sémantiques de `src/styles/global.css` : `--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--action`, `--focus`, `--border-control` et les états. Modifier la source canonique, puis régénérer les exports ; ne pas créer une palette concurrente dans un composant ou un shader.

| Pigment                   | Valeur                            | Usage                                                                |
| ------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| Navy                      | `#081026`                         | Fond principal.                                                      |
| Surface                   | `#111A35`                         | Panneaux et interfaces.                                              |
| Violet                    | `#6B5CFF`                         | Matière, décoration et base des CTA.                                 |
| Pervenche                 | `#8FA4FF`                         | Liens, accents textuels et sélection.                                |
| Lavande                   | `#D7C6FF`                         | Lumière, focus et accent au survol.                                  |
| Ivoire                    | `#FFF8EC`                         | Texte principal.                                                     |
| Muted                     | `#AEB8D0`                         | Texte secondaire.                                                    |
| Deep violet / Blue light  | `#30209A` / `#7DB6FF`             | Ombres et reflets du ruban.                                          |
| Border                    | `#455579`                         | Repères et exports. Les contrôles utilisent un alias plus contrasté. |
| Success / Warning / Error | `#93D9BB` / `#F1CB87` / `#FFB3BF` | Succès, attention et erreur.                                         |

Le violet pur avec un petit texte ivoire donne environ 4,32:1. Le fond `--action` est donc un mélange sRGB de 92 % de violet et 8 % de navy : environ 4,86:1, puis 5,66:1 au survol avec 82 % de violet. Sur la surface, le texte secondaire atteint environ 8,64:1 et la pervenche 7,30:1. Ces rapports sont des calculs de luminance sur les couleurs définies, pas une déclaration de conformité de toutes les pages. Les contrôles, états, compositions et tailles doivent aussi être vérifiés dans le navigateur ; les résultats exécutés figurent dans [qa.md](qa.md).

Les états fonctionnels restent distincts de la palette décorative et accompagnés de texte. Les graphiques partagent les mêmes couleurs de catégories entre aperçus et lab ; le tableau et les libellés restent disponibles.

## Logo et typographie

Le M est un ruban ouvert et asymétrique : première crête plus haute, retour replié, reflets pervenche et lavande. Les deux bords canoniques définissent le SVG et la projection XY de la surface Three.js. Le relief GPU modifie uniquement Z ; la caméra orthographique conserve la silhouette. Les reflets de matière peuvent différer du dégradé SVG, sans introduire un second dessin du M.

Space Grotesk variable sert aux titres et au logotype ; Manrope variable au texte. Les fichiers latins WOFF2 sont chargés localement, sous licence OFL. Dans le site, `Logo.astro` utilise le texte HTML en graisse 600. Pour les exports autonomes, Fontkitten extrait les contours par défaut de Space Grotesk : l’accès aux variations WOFF2 ne restitue pas ici une instance complète de la graisse 600. Le générateur applique donc un épaississement optique explicite, de 42 unités de police pour le nom et 8 pour la signature, avec jonctions arrondies. Ce n’est pas une police de substitution ni une reproduction exacte de l’instance CSS 600.

Les variantes sont : couleur sur fond sombre, couleur avec texte sombre sur fond clair, symbole monochrome blanc pur (#FFFFFF), symbole monochrome navy, assemblage horizontal et assemblage vertical. Les suffixes `dark` et `light` des logos exportés indiquent le fond d’accueil prévu. Les suffixes des symboles monochromes désignent leur couleur.

Règles d’usage :

- Conserver les proportions et le dessin canonique ; la correction optique des petits formats est définie dans les composants et le générateur.
- Garder autour de l’ensemble une zone libre recommandée d’au moins un quart de la hauteur du symbole. Cette marge externe s’ajoute au cadre du fichier exporté.
- Les logos de navigation et les favicons n’affichent pas la signature. La version compacte `Mark` étire légèrement Y de 12 %, centrée verticalement, et retire le fin reflet de bord ; le favicon possède sa propre correction optique dans son carré arrondi.
- Réserver la signature aux présentations et aux formats où elle demeure lisible. Ne pas réduire un export avec signature pour fabriquer une icône.
- Employer le symbole seul pour les usages de 16, 24, 32 et 48 px. L’atelier de marque les présente côte à côte pour le contrôle visuel ; leur présence dans l’atelier n’équivaut pas à une validation finale.
- Ne pas ajouter de contour extérieur, d’ombre portée forte, de rotation permanente ni de signature à un petit logo de navigation.

## Composition et adaptation

La grille reste limitée à 1440 px, avec marges de 56 px sur ordinateur, 32 px sur tablette et 20 px sur mobile. Le rythme utilise 8/16/24/32/48/64/96 px. Les boutons et champs ont un rayon de 8 px ; les panneaux et aperçus, généralement 12 à 14 px. Les courbes servent la matière et les flux ; les contenus restent structurés et lisibles.

Le hero associe le titre, les offres et les CTA à la scène. Les services suivent des lignes éditoriales ouvertes et leurs micro-scènes évoquent une interface, un flux documentaire, des données organisées et des sources reliées à une réponse. La présentation personnelle repose sur le nom de Paul et une composition abstraite ; elle ne simule pas un portrait. Le footer réutilise le composant Logo complet.

À 760 px et moins, la composition passe à une colonne et la scène suit le titre. Les micro-scènes des services restent visibles à une échelle réduite sur l’accueil. La navigation modale conserve Escape et le retour du focus. Le contenu, les liens et le logo final sont présents sans JavaScript.

Les aperçus des réalisations sont des interfaces HTML/SVG alimentées par les mêmes données synthétiques que le lab. Ils ne représentent aucun client ni résultat professionnel revendiqué. La refonte conserve le workflow, le lecteur CSV, les filtres, le contact serveur et les garde-fous de préproduction.

## Mouvement et atelier de marque

Le Morph Engine démarre sur `brand`, puis propose `web`, `automation`, `data` et `ai` : cinq états, dont quatre expertises. La matière part du M et devient une interface, un flux, un graphique ou une relation documentaire. Les contrôles clavier et les replis SVG restent disponibles ; le moteur WebGL est chargé à la demande.

La séquence du logo dure 2,8 secondes dans le hero et 4,8 secondes en présentation. Elle enchaîne impulsion, transformation, stabilisation, révélation du nom et logo final. Elle ne bloque pas l’accès à la page et ne boucle pas automatiquement. Le hero la joue à sa première apparition ; la présentation se pilote avec Lire, Pause, Rejouer et un curseur. Les modes réduit et désactivé affichent immédiatement la composition finale.

La surface Three.js compile ses shaders de manière asynchrone et n’annonce `data-ready` qu’après un rendu réussi. Une scène stabilisée retire son ticker ; une scène hors écran ou un onglet masqué suspend le travail. La gestion des pertes de contexte et le nettoyage à la navigation restent nécessaires. Le détail du cycle de vie est documenté dans [motion.md](motion.md).

`/dev/brand` est une page de contrôle, hors navigation commerciale, absente du sitemap et marquée `noindex`. Elle présente les deux séquences, les variantes, les petits formats, les préférences de mouvement, les pigments et les téléchargements. Elle reste une route accessible : `noindex` n’est pas un mécanisme de confidentialité.

## Exports et captures

Les fichiers de production sont dans `public/brand/` : symboles SVG couleur/blanc/navy, logos horizontaux et verticaux pour fonds clair et sombre, PNG du symbole et du logo horizontal, icônes 32/192/512 px et Apple Touch Icon 180 px. `public/favicon.svg`, `public/mark-monochrome.svg` et `public/og.png` sont aussi générés. Les SVG avec texte vectorisé sont autonomes.

Depuis la racine du dépôt :

```powershell
node --env-file-if-exists=.env scripts/generate-brand.mjs
npm run build
```

Le prébuild appelle déjà ce générateur via `scripts/generate-og.mjs`. Régénérer après un changement du nom public, de la signature, des courbes, de la palette ou du traitement typographique. Le nom provient de `PUBLIC_BRAND_NAME`, avec MorphAI par défaut.

Pour les captures, démarrer le build local, puis exécuter dans un autre terminal :

```powershell
$env:PREVIEW_URL = 'http://127.0.0.1:4322'
node scripts/capture-brand.mjs
node scripts/capture-brand.mjs --video --square
```

Le premier appel produit quatre étapes PNG de la présentation et des captures d’accueil aux largeurs 360, 390, 768, 1440 et 1920 px en mouvement réduit, ainsi que 390 et 1440 px en mode automatique. Les sorties et `capture-report.json` sont dans `test-results/brand/`. Les étapes passent par le véritable curseur de l’atelier, sans animation parallèle.

`--video` ajoute un WebM horizontal 1280 × 720 ; `--square` ajoute un WebM 900 × 900 lorsqu’une capture vidéo est demandée. Le script sérialise le SVG courant à chaque progression, l’inscrit dans un canvas et l’enregistre via MediaRecorder, sur environ 5 secondes. Il vise 30 images par seconde sans garantir une cadence constante. Il capture la présentation SVG, pas un rendu vidéo GPU. Le rapport distingue les images demandées, les compteurs du lecteur, le temps écoulé et les éventuelles indisponibilités. Une lecture complète, le contrôle des dimensions et des extractions d’images conditionnent la validation de chaque WebM.

La conversion H.264 est facultative et demande un FFmpeg disponible avec libx264 :

```powershell
$env:FFMPEG_PATH = 'C:\outils\ffmpeg\bin\ffmpeg.exe'
node scripts/capture-brand.mjs --mp4 --square
```

`--mp4` déclenche aussi la capture WebM. Sans FFmpeg, le WebM reste disponible et le rapport indique que la conversion MP4 n’a pas été effectuée. Ces commandes décrivent les capacités du script ; seules les exécutions consignées dans [qa.md](qa.md) constituent des vérifications réalisées.
