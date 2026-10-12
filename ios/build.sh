#!/bin/bash
# Native iOS build of Ocarina of Time (Ship of Harkinian, Metal) with the game data from
# YOUR OWN ROM embedded in the app, so it never asks for a ROM at launch.
#
# Run on a Mac with Xcode, cmake and ninja (brew install cmake ninja):
#   1. put your ROM in ios/rom/ (.z64, .n64 or .v64)
#   2. ./ios/build.sh            -> generates and opens ios/work/build-ios/Ship.xcodeproj
#   3. in Xcode: scheme "soh", your iPhone as destination, Signing team, then Run
#
#   or ./ios/build.sh --ipa      -> builds an unsigned ios/work/OcarinaOfTime.ipa for SideStore,
#                                   which signs it with a free Apple ID and renews it automatically
#
# Optional environment variables:
#   OOT_TEAM_ID     Apple team ID (otherwise pick it in Xcode > Signing & Capabilities)
#   OOT_BUNDLE_ID   bundle identifier (default com.garwiglino.oot, must be unique to you)
#
# The ROM and the extracted oot.o2r stay in ios/rom/ and ios/work/, both git-ignored:
# never commit or share them, nor the resulting app.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PORT_REPO="https://github.com/rebelancap/Shipwright-ios"
PORT_COMMIT="a273ff4542a27379a2c4a39a469ed9721a8efbad"
WORK="$HERE/work"
PORT="$WORK/Shipwright-ios"
GAMEDATA="$WORK/gamedata"
BUILD="$WORK/build-ios"
BUNDLE_ID="${OOT_BUNDLE_ID:-com.garwiglino.oot}"
TEAM="${OOT_TEAM_ID:-}"
IPA="$WORK/OcarinaOfTime.ipa"

fail() { echo "ERREUR : $*" >&2; exit 1; }
step() { echo; echo "=== $* ==="; }

MODE=xcode
case "${1:-}" in
    "") ;;
    --ipa) MODE=ipa ;;
    *) fail "option inconnue : $1 (seule option : --ipa)" ;;
esac

step "Vérifications"
[[ "$(uname -s)" == "Darwin" ]] || fail "ce script doit être lancé sur un Mac."
command -v xcodebuild >/dev/null || fail "Xcode est requis (App Store), puis : sudo xcode-select -s /Applications/Xcode.app"
command -v cmake >/dev/null || fail "cmake manquant : brew install cmake"
command -v ninja >/dev/null || fail "ninja manquant : brew install ninja"
command -v python3 >/dev/null || fail "python3 manquant : xcode-select --install"
xcodebuild -version | head -1

shopt -s nullglob nocaseglob
roms=("$HERE"/rom/*.z64 "$HERE"/rom/*.n64 "$HERE"/rom/*.v64)
shopt -u nocaseglob
[[ ${#roms[@]} -ge 1 ]] || fail "aucune ROM trouvée : placez votre ROM Ocarina of Time dans $HERE/rom/"
[[ ${#roms[@]} -eq 1 ]] || fail "plusieurs ROM dans $HERE/rom/ : n'en gardez qu'une."
echo "ROM : ${roms[0]}"

step "Conversion de la ROM au format .z64"
mkdir -p "$GAMEDATA"
ROM_Z64="$GAMEDATA/rom.z64"
python3 - "${roms[0]}" "$ROM_Z64" <<'EOF'
import sys
data = bytearray(open(sys.argv[1], 'rb').read())
magic = bytes(data[:4])
if magic == b'\x37\x80\x40\x12':    # .v64: 16-bit byte-swapped
    data[0::2], data[1::2] = data[1::2], data[0::2]
elif magic == b'\x40\x12\x37\x80':  # .n64: 32-bit little-endian
    for i in range(0, len(data) - 3, 4):
        data[i:i + 4] = data[i:i + 4][::-1]
elif magic != b'\x80\x37\x12\x40':
    sys.exit('ERREUR : ce fichier n\'est pas une ROM N64 non compressée')
if b'ZELDA' not in bytes(data[0x20:0x34]).upper():
    sys.exit('ERREUR : cette ROM N64 n\'est pas Ocarina of Time')
open(sys.argv[2], 'wb').write(data)
print('ROM .z64 prête :', sys.argv[2])
EOF

step "Portage iOS (rebelancap/Shipwright-ios, commit épinglé)"
if [[ ! -d "$PORT/.git" ]]; then
    git clone "$PORT_REPO" "$PORT"
fi
git -C "$PORT" fetch -q origin "$PORT_COMMIT"
git -C "$PORT" checkout -q --detach "$PORT_COMMIT"

# Our additions: the launch-time oot.o2r installer, the phone defaults (camera, aiming,
# targeting), the CMake patch that compiles/bundles them, and the shell hook that seeds them.
cp "$HERE/app/SohBundledO2r.m" "$PORT/app/ios/SohBundledO2r.m"
cp "$HERE/app/SohOotPhoneDefaults.m" "$PORT/app/ios/SohOotPhoneDefaults.m"
cp "$HERE/overlay/0900-oot-bundled-o2r.patch" "$PORT/overlay/patches/0900-oot-bundled-o2r.patch"
for p in "$HERE"/overlay-app/*.patch; do
    # Re-applied from the pristine file on every run, so the script can be re-run safely.
    files=$(sed -n 's#^+++ b/\([^[:space:]]*\).*#\1#p' "$p")
    git -C "$PORT" checkout -q -- $files
    patch -p1 --forward --fuzz=0 -d "$PORT" < "$p" >/dev/null || fail "le patch $(basename "$p") ne s'applique pas"
    echo "patch appliqué : $(basename "$p")"
done

step "Sources Ship of Harkinian 9.3.0 + patchs iOS"
"$PORT/scripts/bootstrap.sh"
"$PORT/scripts/apply-overlay.sh"

step "Dépendances audio iOS"
[[ -f "$PORT/work/ios-deps/prefix/lib/libopusfile.a" ]] || "$PORT/scripts/build-audio-deps-ios.sh"

step "Compilation des outils macOS (soh.o2r + extracteur de ROM)"
SOH_O2R="$PORT/oracle/build-cmake/soh/soh.o2r"
[[ -f "$SOH_O2R" && -x "$PORT/oracle/build-cmake/soh-torch" ]] || "$PORT/scripts/build-oracle.sh"

step "Extraction des données du jeu depuis votre ROM (oot.o2r)"
OOT_O2R="$GAMEDATA/oot.o2r"
if [[ ! -s "$OOT_O2R" || "$ROM_Z64" -nt "$OOT_O2R" ]]; then
    "$PORT/scripts/extract-oot-o2r.sh" "$ROM_Z64" "$GAMEDATA"
fi
ls -lh "$OOT_O2R"

step "Génération du projet Xcode"
SOH_VERSION="$(tr -d '[:space:]' < "$PORT/VERSION")"
cmake --no-warn-unused-cli -S "$PORT/vendor/Shipwright" -B "$BUILD" -GXcode \
    -DCMAKE_XCODE_ATTRIBUTE_STRIP_INSTALLED_PRODUCT=NO \
    -DCMAKE_SYSTEM_NAME=iOS -DCMAKE_OSX_DEPLOYMENT_TARGET=15.0 \
    -DDEPLOYMENT_TARGET=15.0 \
    -DCMAKE_BUILD_TYPE:STRING=Release \
    "-DSOH_IOS_VERSION=$SOH_VERSION" "-DSOH_IOS_BUILD=$(date -u +%Y%m%d%H%M)" \
    -DSOH_REMOTE_CONSOLE=OFF \
    "-DSOH_IOS_DEPS_PREFIX=$PORT/work/ios-deps/prefix" \
    "-DSOH_O2R_PATH=$SOH_O2R" \
    "-DSOH_OOT_O2R_PATH=$OOT_O2R" \
    "-DSOH_IOS_SHELL_DIR=$PORT/app/ios" \
    "-DSOH_IOS_BUNDLE_IDENTIFIER=$BUNDLE_ID" \
    "-DSOH_IOS_DEVELOPMENT_TEAM=$TEAM"

PROJECT="$BUILD/Ship.xcodeproj"
[[ -d "$PROJECT" ]] || fail "projet Xcode introuvable : $PROJECT"

if [[ "$MODE" == "ipa" ]]; then
    step "Compilation de l'app (non signée, pour SideStore)"
    cmake --build "$BUILD" --config Release --target soh --parallel "$(sysctl -n hw.ncpu)" -- \
        CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""
    APP="$BUILD/soh/Release-iphoneos/soh.app"
    [[ -d "$APP" ]] || fail "app introuvable : $APP"
    [[ -f "$APP/oot.o2r" ]] || fail "oot.o2r absent de l'app : le patch 0900 n'a pas été appliqué"
    "$PORT/scripts/assert-app-assets.sh" "$APP"

    step "Création de l'IPA"
    rm -rf "$WORK/ipa" "$IPA"
    mkdir -p "$WORK/ipa/Payload"
    cp -R "$APP" "$WORK/ipa/Payload/"
    (cd "$WORK/ipa" && zip -qry "$IPA" Payload)
    rm -rf "$WORK/ipa"
    ls -lh "$IPA"

    step "Terminé"
    echo "IPA : $IPA"
    echo "Envoyez-la sur l'iPhone (AirDrop -> Fichiers), puis dans SideStore : My Apps -> + -> choisissez l'IPA."
    echo "Usage personnel uniquement : elle contient les données de votre ROM, ne la partagez pas."
    open -R "$IPA"
    exit 0
fi

step "Terminé"
echo "Projet Xcode : $PROJECT"
echo "Dans Xcode : schéma « soh », votre iPhone comme destination, onglet Signing & Capabilities"
echo "de la cible soh -> votre Team, puis Run (⌘R)."
open "$PROJECT"
