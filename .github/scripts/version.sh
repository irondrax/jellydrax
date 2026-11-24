#!/usr/bin/env bash
# Setzt VERSION und SKIP.
#   bash version.sh          -> Windows: Version aus src/JellyDrax/JellyDrax.csproj (oder Tag)
#   bash version.sh linux    -> Linux:   Version aus linux/package.json; gebaut wird nur, wenn sie
#                               zur Release-Version passt (so kann Windows allein aktualisiert werden)
# SKIP=true, wenn das Release dieser Version die Dateien der Plattform schon enthält.
set -euo pipefail
release="$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' src/JellyDrax/JellyDrax.csproj | head -1)"
if [[ "${GITHUB_REF}" == refs/tags/v* ]]; then release="${GITHUB_REF_NAME#v}"; fi
version="$release"
skip=false
if [[ "${1:-}" == "linux" ]]; then
  version="$(node -p "require('./linux/package.json').version")"
  if [[ "$version" != "$release" ]]; then
    echo "Linux-Version $version gehört nicht zu Release $release – Linux wird diesmal nicht gebaut."
    skip=true
  fi
fi
# Übersprungen wird nur, wenn die Dateien DIESER Plattform schon im Release liegen – so lässt sich
# ein fehlgeschlagener Windows- oder Linux-Teil nachholen, auch wenn der andere das Release angelegt hat.
if [[ "${1:-}" == "linux" ]]; then marker="JellyDrax-$version-x86_64.AppImage"; else marker="JellyDrax-Setup-$version.exe"; fi
if [[ "$skip" == "false" && "${PUBLISH}" == "true" ]] &&
   gh release view "v$version" --json assets --jq '.assets[].name' 2> /dev/null | grep -qxF "$marker"; then
  echo "v$version enthält bereits $marker – Build wird übersprungen."
  skip=true
fi
echo "VERSION=$version" >> "$GITHUB_ENV"
echo "SKIP=$skip" >> "$GITHUB_ENV"
echo "Version: $version (überspringen: $skip)"
