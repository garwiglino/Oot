# Oot — Ocarina of Time dans le navigateur (mobile)

Version web d'Ocarina of Time, jouable dans Safari sur iPhone, basée sur
[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) (portage PC issu de la
décompilation [zeldaret/oot](https://github.com/zeldaret/oot)) et sur son fork WebAssembly
[zalo/Shipwright](https://github.com/zalo/Shipwright/tree/feature/emscripten-web-port).

Le jeu est **compilé nativement en WebAssembly + WebGL 2** : ce n'est pas un émulateur N64.

Ce dépôt ne contient **aucune donnée du jeu** : vous fournissez votre propre ROM, qui est
extraite **dans votre navigateur, sur votre appareil**. Elle n'est jamais envoyée ni publiée.

## Jouer

1. Ouvrez le site du jeu dans Safari : `https://garwiglino.github.io/Oot/`
2. Touchez la zone de chargement et choisissez votre ROM (`.z64`, `.n64` ou `.v64`, non compressée).
3. L'extraction prend une à deux minutes la première fois, puis tout est gardé en cache.
4. Astuce : Partager → **Sur l'écran d'accueil** pour l'ouvrir en plein écran comme une app.

Versions de ROM reconnues : N64 NTSC 1.0 / 1.1 / 1.2, N64 PAL 1.0 / 1.1, GameCube (NTSC, PAL, Master Quest).

### Performances (objectif 60 FPS)

La logique du jeu tourne à 20 Hz comme l'original ; les images intermédiaires sont interpolées
à la fréquence de l'écran (`requestAnimationFrame`, 60 Hz sur iPhone). Pour afficher un compteur
de FPS, ajoutez `#fps` à l'adresse : `https://garwiglino.github.io/Oot/#fps`.

> Ne mettez **jamais** la ROM dans ce dépôt : il est public. Le `.gitignore` bloque les extensions courantes.

## Fonctionnement

1. Les sources de `zalo/Shipwright` (commit `f81ff64`) sont compilées en WebAssembly avec
   Emscripten 3.1.64, après application de [`patches/web-mobile-perf.patch`](patches/web-mobile-perf.patch).
2. Le site compilé (`index.html`, `soh.js`, `soh.wasm`, `soh.data`, `soh.o2r`) est poussé sur la
   branche **`web-build`**, pour ne pas alourdir `main`.
3. Le workflow [`deploy-web.yml`](.github/workflows/deploy-web.yml) publie cette branche sur GitHub Pages
   (onglet **Actions** → *Publier le jeu web* → **Run workflow**).

Le workflow [`build-web.yml`](.github/workflows/build-web.yml) permet aussi de tout compiler sur GitHub,
à lancer à la main (onglet **Actions** → *Compiler et publier le jeu web* → **Run workflow**).

### Activation de GitHub Pages (une seule fois)

**Settings** → **Pages** → **Source** : **GitHub Actions**.

## Modifications apportées (`patches/web-mobile-perf.patch`)

- Compilation web en `-O2` (au lieu de `-O1`) et `ASSERTIONS=0`, pour tenir 60 FPS.
- Compteur de FPS optionnel (`#fps`).
- Sélecteur de fichier sans filtre d'extension : iOS grise sinon les fichiers `.z64`.
- Conversion automatique des ROM `.n64` et `.v64` vers le format `.z64`, avec vérification de la ROM.
- Textes de l'écran de chargement en français.

## Crédits

[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) par HarbourMasters,
portage web par [zalo](https://github.com/zalo/Shipwright),
décompilation par [zeldaret](https://github.com/zeldaret/oot).
