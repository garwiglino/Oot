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

Avec un compte Apple gratuit, préférez la méthode **SideStore** ci-dessous (`./ios/build.sh --ipa`) :
l'app est renouvelée automatiquement et n'expire pas au bout de 7 jours.

Variables optionnelles : `OOT_TEAM_ID` (identifiant d'équipe Apple, pour ne pas le choisir dans Xcode)
et `OOT_BUNDLE_ID` (identifiant de l'app, `com.garwiglino.oot` par défaut).

## Compte Apple gratuit : renouvellement automatique avec SideStore

Apple limite à **7 jours** la signature des apps installées avec un compte gratuit ; aucun projet ne
peut lever cette limite. [SideStore](https://sidestore.io) la rend invisible : il signe l'app avec votre
compte gratuit et la **renouvelle tout seul sur l'iPhone**, sans Mac.

1. Installez SideStore une fois sur l'iPhone, depuis le Mac, avec [iloader](https://github.com/nab138/iloader).
2. Construisez l'IPA :

   ```sh
   ./ios/build.sh --ipa
   ```

   Elle est créée dans `ios/work/OcarinaOfTime.ipa` (non signée, avec les données de votre ROM intégrées).
3. Envoyez-la sur l'iPhone par AirDrop et enregistrez-la dans **Fichiers**.
4. Dans SideStore : **My Apps** → **+** → choisissez `OcarinaOfTime.ipa`.
5. Activez le rafraîchissement automatique en suivant la [documentation de SideStore](https://docs.sidestore.io).
   SideStore affiche les jours restants ; si un renouvellement automatique échoue, ouvrez-le et
   touchez **Refresh All** avant l'échéance. Les sauvegardes sont conservées.

Limites du compte gratuit : 3 apps installées de cette façon en même temps, SideStore compris.

Sans SideStore, installée depuis Xcode, l'app expire après 7 jours : relancez-la depuis Xcode (⌘R).
Un compte Apple Developer payant porte la durée à un an.

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
