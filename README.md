# Oot — Ocarina of Time dans le navigateur (mobile)

Version web d'Ocarina of Time, jouable dans Safari sur iPhone, basée sur
[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) (portage PC issu de la
décompilation [zeldaret/oot](https://github.com/zeldaret/oot)) et sur son fork WebAssembly
[zalo/Shipwright](https://github.com/zalo/Shipwright/tree/feature/emscripten-web-port).

Le jeu est **compilé nativement en WebAssembly + WebGL 2** : ce n'est pas un émulateur N64.

Ce dépôt ne contient **aucune donnée du jeu** : vous fournissez votre propre ROM, qui est
extraite **dans votre navigateur, sur votre appareil**. Elle n'est jamais envoyée ni publiée.

## Jouer

La version publiée est prête à ouvrir lorsque l'action **Tester le jeu web** est verte
sur [GitHub Actions](https://github.com/garwiglino/Oot/actions). Cette action vérifie le
chargement du moteur dans Chromium et WebKit sans ROM ; elle ne valide pas une partie complète.

1. Ouvrez le site du jeu dans Safari : `https://garwiglino.github.io/Oot/`
2. Touchez la zone de chargement et choisissez votre ROM (`.z64`, `.n64` ou `.v64`, non compressée).
3. L'extraction prend une à deux minutes la première fois, puis tout est gardé en cache.
4. Astuce : Partager → **Sur l'écran d'accueil** pour l'ouvrir en plein écran comme une app.

Versions de ROM reconnues : N64 NTSC 1.0 / 1.1 / 1.2, N64 PAL 1.0 / 1.1, GameCube (NTSC, PAL, Master Quest).

### Performances (objectif 60 FPS)

La logique du jeu tourne à 20 Hz comme l'original ; le portage prévoit une interpolation des images.
L'objectif de 60 FPS doit être vérifié en jeu sur l'appareil utilisé. Le compteur `#fps`
(`https://garwiglino.github.io/Oot/#fps`) mesure les callbacks `requestAnimationFrame` du navigateur ;
il ne prouve pas, à lui seul, que le jeu a rendu autant d'images.

> Ne mettez **jamais** la ROM dans ce dépôt : il est public. Le `.gitignore` bloque les extensions courantes.

## Fonctionnement

1. Le workflow [`build-web.yml`](.github/workflows/build-web.yml) compile le moteur épinglé
   au commit `f81ff64` de `zalo/Shipwright` avec Emscripten 3.1.64. Les grosses tables du
   randomizer sont compilées une par une, puis le reste utilise trois tâches parallèles.
2. Il assemble `index.html`, `soh.js`, `soh.wasm`, `soh.data` et `soh.o2r`, vérifie que le
   module WebAssembly est accepté, puis conserve le résultat dans l'artefact **oot-web-site**.
   Les journaux sont conservés séparément, y compris en cas d'échec.
3. Le workflow [`test-web.yml`](.github/workflows/test-web.yml) reprend cet artefact, applique
   [`web/fix-loader.cjs`](web/fix-loader.cjs), puis vérifie le chargement dans **Chromium et WebKit**,
   le refus d'un faux fichier ROM, les boutons tactiles et le rechargement de la page.
4. Une fois les tests réussis, il conserve les fichiers sur **web-build** et publie GitHub Pages.
   Les rapports et captures sont disponibles dans **oot-web-browser-reports**.

Pour lancer une nouvelle compilation : **Actions → Compiler et publier le jeu web → Run workflow**.
Pour retester ou corriger uniquement le chargeur : **Actions → Tester le jeu web → Run workflow**,
en indiquant l'identifiant numérique de l'exécution contenant **oot-web-site**. Cette voie réutilise
le moteur déjà compilé (artefact disponible 14 jours) et évite de recommencer la compilation C++.
Les fichiers publiés restent ensuite sur `web-build`, même après expiration des artefacts.

Le workflow [`deploy-web.yml`](.github/workflows/deploy-web.yml) peut republier directement la
branche `web-build` déjà vérifiée. Les fichiers du dossier `ios/` et le portage natif iOS
suivent un processus distinct ; ces tests web ne les valident pas.

### Portée des vérifications

Les tests automatiques n'utilisent aucune ROM Nintendo. Ils vérifient le moteur en attente de ROM,
les ressources de l'extracteur, les erreurs de sélection et les entrées tactiles JavaScript.
L'extraction d'une ROM réelle, le rendu du jeu, l'audio, les sauvegardes d'une partie et les performances
sur un iPhone physique doivent encore être vérifiés avec la ROM du joueur. WebKit sur Linux n'est
pas un test sur un iPhone physique.

### Activation de GitHub Pages (une seule fois)

**Settings** → **Pages** → **Source** : **GitHub Actions**.

## Modifications apportées (`patches/web-mobile-perf.patch`)

- Compilation web en `-O2` (au lieu de `-O1`) et `ASSERTIONS=0`, pour viser de meilleures performances (60 FPS non garantis).
- Compteur de FPS optionnel (`#fps`).
- Sélecteur de fichier sans filtre d'extension : iOS grise sinon les fichiers `.z64`.
- Conversion automatique des ROM `.n64` et `.v64` vers le format `.z64`, avec vérification de la ROM.
- Textes de l'écran de chargement en français.

## Crédits

[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) par HarbourMasters,
portage web par [zalo](https://github.com/zalo/Shipwright),
décompilation par [zeldaret](https://github.com/zeldaret/oot).

## Corrections du chargeur après compilation

`web/fix-loader.cjs` corrige l'écran de chargement sans modifier le moteur :

- le cache contenant uniquement `soh.o2r` n'est plus traité comme une erreur ;
- une indisponibilité d'IndexedDB n'empêche plus le téléchargement de l'archive du moteur ;
- une ROM choisie avant la fin du chargement est mise en attente ;
- le clavier mobile n'interroge pas ImGui avant le démarrage du jeu.

Ces remplacements sont contrôlés : si le HTML amont change, la préparation échoue explicitement.
