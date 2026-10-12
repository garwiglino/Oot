# Ocarina of Time natif sur iPhone

App iOS native (Metal, 60 Hz / 120 Hz ProMotion, commandes tactiles, manettes Bluetooth) basée sur
[Ship of Harkinian](https://github.com/HarbourMasters/Shipwright) 9.3.0 — le portage PC issu de la
décompilation [zeldaret/oot](https://github.com/zeldaret/oot) — et sur le portage iOS
[rebelancap/Shipwright-ios](https://github.com/rebelancap/Shipwright-ios).

Différence avec ce portage : les données du jeu, extraites de **votre** ROM sur votre Mac, sont
intégrées à l'app. Elle démarre directement, **sans demander de ROM au lancement**.

> Usage strictement personnel. La ROM, `oot.o2r` et l'app compilée contiennent des données de
> Nintendo : ne les envoyez pas sur GitHub et ne les partagez pas. `ios/rom/` et `ios/work/` sont
> ignorés par Git.

## Prérequis

- Un Mac avec la **dernière version de Xcode** (App Store), ouverte une fois pour installer les composants
- [Homebrew](https://brew.sh), puis : `brew install cmake ninja`
- Environ **20 Go** d'espace libre
- Un compte Apple (gratuit ou Apple Developer)
- Sur l'iPhone : **Réglages → Confidentialité et sécurité → Mode développeur** activé

## Compiler

```sh
git clone https://github.com/garwiglino/Oot.git
cd Oot
cp ~/chemin/vers/votre-rom.z64 ios/rom/
./ios/build.sh
```

La première fois, comptez 30 à 60 minutes : le script récupère les sources, compile les outils macOS,
extrait les données de votre ROM (`oot.o2r`), puis génère et ouvre **`ios/work/build-ios/Ship.xcodeproj`**.

Dans Xcode :

1. Schéma **soh**, et votre iPhone (branché ou en Wi-Fi) comme destination.
2. Cible **soh** → **Signing & Capabilities** → **Team** : votre compte Apple.
   Si l'identifiant est refusé, changez **Bundle Identifier** (par ex. `com.votrenom.oot`).
3. **Run** (⌘R).

Au premier lancement sur l'iPhone, si iOS bloque l'app : **Réglages → Général → VPN et gestion de
l'appareil** → faites confiance à votre profil développeur.

Variables optionnelles : `OOT_TEAM_ID` (identifiant d'équipe Apple, pour ne pas le choisir dans Xcode)
et `OOT_BUNDLE_ID` (identifiant de l'app, `com.garwiglino.oot` par défaut).

## Compte Apple gratuit

L'app fonctionne **7 jours**, puis il faut la réinstaller depuis Xcode (⌘R) : les sauvegardes sont
conservées. Un compte Apple Developer payant porte cette durée à un an.

## Comment ça marche

| Fichier | Rôle |
|---|---|
| [`build.sh`](build.sh) | Tout le processus : vérifications, conversion de la ROM en `.z64`, portage iOS épinglé (commit `a273ff4`), extraction de `oot.o2r`, génération du projet Xcode |
| [`overlay/0900-oot-bundled-o2r.patch`](overlay/0900-oot-bundled-o2r.patch) | Ajoute `oot.o2r` aux ressources de l'app (`-DSOH_OOT_O2R_PATH`) |
| [`app/SohBundledO2r.m`](app/SohBundledO2r.m) | Au lancement, avant le moteur, copie `oot.o2r` dans Documents : l'écran « ROM needed » n'apparaît jamais |

Le projet Xcode est généré sur votre Mac par CMake (chemins absolus propres à votre machine) : il n'est
donc pas stocké dans le dépôt. Relancez `./ios/build.sh` pour le régénérer ; les étapes déjà faites
sont sautées.

## Limites connues

Ce projet n'a pas pu être compilé ni testé depuis l'environnement où il a été préparé (pas de macOS).
Le patch a été vérifié sur l'arbre exact du portage (61 patchs + celui-ci, appliqués sans décalage),
mais si une étape échoue sur votre Mac, copiez le message d'erreur : il indiquera quoi corriger.
