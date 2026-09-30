# Instrument de précision

La matière devient un système : une composition éditoriale sur graphite, un objet cuivré transformable, des interfaces visibles plutôt que des photographies fictives. La piste alternative « Atelier de matière » (papier clair et volumes cuivrés) a été écartée pour donner plus de présence à la scène. Le choix est réversible par les tokens.

## Système

- Fond `#101110`, surfaces `#191a18` et `#1b1d18`, texte `#eeeae3`, secondaire `#aaa99e`, accent `#f1814b`.
- Space Grotesk variable pour titres et identité ; Manrope variable pour texte. Seuls les sous-ensembles latins WOFF2 sont chargés localement. Licences OFL distribuées avec les packages Fontsource.
- Grille maximale 1440 px, marges de 56 px sur ordinateur, 32 px tablette, 20 px mobile. Rythme 8/16/24/32/48/64/96.
- Rayons sobres : 3 px sur boutons, 6–9 px dans les interfaces ; cercle réservé aux repères et flèches. Pas d’ombre ou de flou plein écran.
- Accent : action principale, état sélectionné, flux, symbole. Aucun code couleur seul pour transmettre un état.
- Signe SVG original formé de deux modules en M, réutilisable avec un autre nom. Favicon et variante monochrome dans `public/`. Aucun symbole de marque déposée.

## Composition

Le hero confronte un titre immédiatement lisible à une fenêtre sculptée. Les quatre états de cette matière correspondent aux quatre expertises. Après le ruban verbal, les services suivent des lignes horizontales ouvertes, les projets adoptent deux hauteurs différentes, la méthode devient une progression et la présentation personnelle utilise un monogramme abstrait explicitement décoratif. Le footer reprend l’échelle du hero.

Les SVG des projets sont des aperçus des démonstrateurs effectivement construits ; leur contenu synthétique est partagé avec le lab. Ce ne sont ni des captures client ni des résultats professionnels revendiqués.

## Adaptation

Une colonne à 760 px ; objet sous le titre, commandes toujours dans le DOM, CTA visibles avant la scène. Navigation modale native avec Escape et retour du focus. Sans JavaScript, liens de navigation accessibles. Les services gardent leurs explications textuelles ; les micro-scènes secondaires sont retirées du home mobile pour limiter la densité, mais restent disponibles sur les pages services.

Les textes, liens et sections restent visibles avant tout script. Les deux choix de polices n’introduisent aucune requête tierce.
