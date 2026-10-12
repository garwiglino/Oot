# Oot — Ocarina of Time dans le navigateur (mobile)

Version web d'Ocarina of Time, jouable dans Safari sur iPhone, basée sur
[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) (portage PC issu de la
décompilation [zeldaret/oot](https://github.com/zeldaret/oot)) et sur son fork WebAssembly
[zalo/shipwright-64](https://github.com/zalo/shipwright-64).

Ce dépôt ne contient **aucune donnée du jeu** : vous fournissez votre propre ROM, qui est
extraite **dans votre navigateur, sur votre appareil**. Elle n'est jamais envoyée ni publiée.

## Jouer

1. Ouvrez le site du jeu dans Safari : `https://garwiglino.github.io/Oot/`
2. Touchez la zone de chargement et choisissez votre ROM (`.z64`, `.n64` ou `.v64`, non compressée).
3. L'extraction prend une à deux minutes la première fois, puis tout est gardé en cache.
4. Astuce : Partager → **Sur l'écran d'accueil** pour l'ouvrir en plein écran comme une app.

Versions de ROM reconnues : N64 NTSC 1.0 / 1.1 / 1.2, N64 PAL 1.0 / 1.1, GameCube (NTSC, PAL, Master Quest).

> Ne mettez **jamais** la ROM dans ce dépôt : il est public. Le `.gitignore` bloque les extensions courantes.

## Fonctionnement

À chaque push sur `main`, le workflow [`build-web.yml`](.github/workflows/build-web.yml) :

1. récupère les sources de `zalo/shipwright-64` à un commit fixe ;
2. applique [`patches/shell-mobile-fr.patch`](patches/shell-mobile-fr.patch) ;
3. compile en WebAssembly avec Emscripten 3.1.64 ;
4. publie le site sur GitHub Pages.

Il peut aussi être relancé à la main : onglet **Actions** → *Compiler et publier le jeu web* → **Run workflow**.

### Activation de GitHub Pages (une seule fois)

**Settings** → **Pages** → **Source** : **GitHub Actions**.

## Modifications apportées (`patches/shell-mobile-fr.patch`)

- Sélecteur de fichier sans filtre d'extension : iOS grise sinon les fichiers `.z64`.
- Conversion automatique des ROM `.n64` et `.v64` vers le format `.z64`.
- Textes de l'écran de chargement en français.
- Mode Mario (libsm64) masqué.

## Crédits

[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) par HarbourMasters,
portage web par [zalo](https://github.com/zalo/shipwright-64),
décompilation par [zeldaret](https://github.com/zeldaret/oot).
