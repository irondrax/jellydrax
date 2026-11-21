#!/usr/bin/env bash
# Setzt VERSION (aus Tag oder csproj) und SKIP=true, wenn für diese Version auf main schon ein
# Release existiert (dann gibt es nichts zu bauen).
set -euo pipefail
if [[ "${GITHUB_REF}" == refs/tags/v* ]]; then
  version="${GITHUB_REF_NAME#v}"
else
  version="$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' src/JellyDrax/JellyDrax.csproj | head -1)"
fi
echo "VERSION=$version" >> "$GITHUB_ENV"
skip=false
if [[ "${PUBLISH}" == "true" ]] && gh release view "v$version" --json url > /dev/null 2>&1; then
  echo "Release v$version existiert bereits – Build wird übersprungen."
  skip=true
fi
echo "SKIP=$skip" >> "$GITHUB_ENV"
echo "Version: $version (überspringen: $skip)"
