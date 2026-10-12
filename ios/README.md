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
- [Homebrew](https://brew.sh), puis : `brew install cmake ninja sdl2-compat glew`
- Environ **20 Go** d'espace libre
- Un compte Apple (gratuit ou Apple Developer)
- Sur l'iPhone : **Réglages → Confidentialité et sécurité → Mode développeur** activé

SDL2 et GLEW servent aux outils **macOS** de préparation des données. Le script accepte aussi
une installation Homebrew existante de `sdl2` et transmet les chemins Homebrew uniquement
à la compilation de ces outils, sans les ajouter à la cible iOS.

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

Avec un compte Apple gratuit, préférez la méthode **SideStore** ci-dessous (`./ios/build.sh --ipa`) :
SideStore peut renouveler sa signature avant l'échéance. Ce renouvellement doit être configuré
sur l'iPhone et peut échouer ; il ne supprime pas la limite Apple.

Variables optionnelles : `OOT_TEAM_ID` (identifiant d'équipe Apple, pour ne pas le choisir dans Xcode)
et `OOT_BUNDLE_ID` (identifiant de l'app, `com.garwiglino.oot` par défaut).

## Compte Apple gratuit : renouvellement automatique avec SideStore

Le mode `./ios/build.sh --ipa` prépare une IPA non signée pour SideStore.
Aucun code d'auto-signature ni identifiant Apple n'est intégré au jeu.
**La configuration ci-dessous se fait sur l'iPhone : générer l'IPA ne l'active pas.**

### Installation initiale

1. Installez SideStore avec iloader en suivant le [guide officiel](https://docs.sidestore.io/docs/installation/install).
   Préparez aussi **LocalDevVPN**, comme indiqué dans les [prérequis](https://docs.sidestore.io/docs/installation/prerequisites).
2. Connectez l'iPhone au Wi-Fi, activez LocalDevVPN, puis connectez-vous à SideStore avec
   le même compte Apple que pour son installation.
3. Dans **My Apps**, renouvelez d'abord **SideStore lui-même** en touchant son compteur de jours.
4. Sur le Mac, depuis la racine du dépôt, lancez :
   ```sh
   ./ios/build.sh --ipa
   ```
5. Transférez `ios/work/OcarinaOfTime.ipa` par AirDrop vers Fichiers sur l'iPhone.
   Dans **SideStore → My Apps → +**, sélectionnez cette IPA.

### Renouvellement en arrière-plan

- Autorisez **SideStore** dans **Réglages → Général → Actualisation en arrière-plan**.
- Gardez LocalDevVPN actif lorsque SideStore doit installer ou renouveler les apps.
  Prévoyez une connexion Wi-Fi pour la configuration décrite par la documentation officielle.
- Évitez le mode économie d'énergie pendant les renouvellements automatiques :
  [iOS désactive alors l'actualisation en arrière-plan](https://developer.apple.com/documentation/uikit/uiapplication/backgroundrefreshstatus).
- Autorisez les notifications de SideStore pour suivre les résultats.
- Faites un premier **Refresh All** manuel et vérifiez que SideStore et Ocarina of Time
  reviennent à environ **7 DAYS**. Vérifiez ensuite qu'un renouvellement automatique se produit.

La [FAQ officielle](https://docs.sidestore.io/docs/faq) décrit les renouvellements périodiques
en arrière-plan. Leur exécution dépend d'iOS, du réseau et de la validité du compte et de
l'appairage : **aucune garantie d'absence d'expiration**. Si le compteur descend sans remonter,
ouvrez SideStore avec LocalDevVPN actif et utilisez **Refresh All** avant l'échéance.

Le renouvellement réutilise l'IPA installée : il ne faut pas recompiler le jeu chaque semaine.
Avec un compte gratuit, la limite reste de trois apps actives, SideStore compris.
N'effacez pas le jeu pour renouveler sa signature ; sauvegardez vos parties avant une
réinstallation ou un changement de compte.

## Réglages pensés pour le téléphone

Au premier lancement, l'app applique ces réglages une seule fois. Tout reste modifiable ensuite dans le
menu ≡ du jeu, et vos changements ne sont jamais écrasés.

| | Réglage | Effet |
|---|---|---|
| Caméra | **Free Look** activé | Caméra libre : glisser un doigt sur une zone vide de l'écran tourne la caméra |
| Caméra | **Fix Camera Drift**, **Fix Camera Swing**, caméra d'inactivité désactivée | Caméra stable : pas de dérive, pas de balancement, pas de recentrage quand Link est immobile |
| Visée | **Disable Auto-Centering in First-Person View** | En vue subjective, la vue reste là où vous l'avez orientée |
| Ciblage | **Reworked Targeting**, et Z tactile sans double-tap | Un tap sur Z verrouille, un tap libère, toujours ; le pouce reste libre pendant le combat |

**Caméra automatique comme sur N64** : désactivez **Free Look** dans le menu ≡.
La **visée au gyroscope** reste disponible dans les réglages iOS du menu (désactivée par défaut).

### Étape 2, après votre premier test sur iPhone

Nouvelles mécaniques, ajoutées une par une :

- recentrage automatique de la caméra derrière Link après quelques secondes sans y toucher (caméra libre) ;
- viser en glissant le doigt en vue subjective (arc, lance-pierre, grappin) ;
- aide à la visée légère vers la cible la plus proche du réticule ;
- changer de cible d'un geste sur Z, sans relâcher puis reverrouiller.

## Comment ça marche

| Fichier | Rôle |
|---|---|
| [`build.sh`](build.sh) | Tout le processus : vérifications, conversion de la ROM en `.z64`, portage iOS épinglé (commit `a273ff4`), extraction de `oot.o2r`, génération du projet Xcode |
| [`overlay/0900-oot-bundled-o2r.patch`](overlay/0900-oot-bundled-o2r.patch) | Ajoute `oot.o2r` aux ressources de l'app (`-DSOH_OOT_O2R_PATH`) et compile les deux fichiers ci-dessous |
| [`app/SohBundledO2r.m`](app/SohBundledO2r.m) | Au lancement, avant le moteur, copie `oot.o2r` dans Documents : l'écran « ROM needed » n'apparaît jamais |
| [`app/SohOotPhoneDefaults.m`](app/SohOotPhoneDefaults.m) | Réglages téléphone du premier lancement (caméra, visée, ciblage), versionnés |
| [`overlay-app/0001-oot-phone-defaults-call.patch`](overlay-app/0001-oot-phone-defaults-call.patch) | Appelle ces réglages juste après ceux du portage, avant l'initialisation des améliorations |

Le projet Xcode est généré sur votre Mac par CMake (chemins absolus propres à votre machine) : il n'est
donc pas stocké dans le dépôt. Relancez `./ios/build.sh` pour le régénérer ; les étapes déjà faites
sont sautées.

## Limites connues

Ce projet n'a pas pu être compilé ni testé depuis l'environnement où il a été préparé (pas de macOS).
Le patch a été vérifié sur l'arbre exact du portage (61 patchs + celui-ci, appliqués sans décalage),
mais si une étape échoue sur votre Mac, copiez le message d'erreur : il indiquera quoi corriger.
