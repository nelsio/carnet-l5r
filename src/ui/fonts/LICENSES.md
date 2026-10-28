# Polices embarquées

Sous-ensembles latins (woff2) récupérés depuis Google Fonts, sous licence SIL Open Font License 1.1.

Sous-ensemble kanji `shippori-mincho-b1-800-kanji.woff2` (帳 du sceau, 土水火風空 des Anneaux) tiré de `ShipporiMinchoB1-ExtraBold.ttf` (dépôt google/fonts) :

```bash
pyftsubset ShipporiMinchoB1-ExtraBold.ttf --text="帳土水火風空" --flavor=woff2 --layout-features='' \
  --output-file=src/ui/fonts/shippori-mincho-b1-800-kanji.woff2
```

La favicon (`src/ui/favicon.svg`, `src/ui/apple-touch-icon.png`) reprend le contour vectorisé du glyphe 帳 de la même police.

| Police | Graisses | Auteurs | Licence |
|---|---|---|---|
| Shippori Mincho B1 | 600, 800 (+ kanji 800) | The Shippori Mincho Project Authors | [OFL-shipporiminchob1.txt](OFL-shipporiminchob1.txt) |
| Zen Kaku Gothic New | 400, 500, 700 | The Zen Kaku Gothic Project Authors | [OFL-zenkakugothicnew.txt](OFL-zenkakugothicnew.txt) |
| JetBrains Mono | 500, 700 (fichier variable) | The JetBrains Mono Project Authors | [OFL-jetbrainsmono.txt](OFL-jetbrainsmono.txt) |
