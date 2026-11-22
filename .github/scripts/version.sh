#!/usr/bin/env bash
# Setzt VERSION und SKIP.
#   bash version.sh          -> Windows: Version aus src/JellyDrax/JellyDrax.csproj (oder Tag)
#   bash version.sh linux    -> Linux:   Version aus linux/package.json; gebaut wird nur, wenn sie
#                               zur Release-Version passt (so kann Windows allein aktualisiert werden)
# SKIP=true, wenn für diese Version auf main schon ein Release existiert.
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
if [[ "$skip" == "false" && "${PUBLISH}" == "true" ]] && gh release view "v$version" --json url > /dev/null 2>&1; then
  echo "Release v$version existiert bereits – Build wird übersprungen."
  skip=true
fi
echo "VERSION=$version" >> "$GITHUB_ENV"
echo "SKIP=$skip" >> "$GITHUB_ENV"
echo "Version: $version (überspringen: $skip)"
