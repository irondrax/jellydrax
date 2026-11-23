#!/usr/bin/env bash
# Behält nur die neuesten N Releases (Standard: 3); ältere werden samt Tag gelöscht.
# Läuft erst, wenn das Release der aktuellen Version existiert – so bleibt immer mindestens ein
# vollständiges Release erhalten, falls ein Build fehlschlägt.
set -euo pipefail
keep="${1:-3}"
current="v$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' src/JellyDrax/JellyDrax.csproj | head -1)"
if ! gh release view "$current" --json url > /dev/null 2>&1; then
  echo "Release $current existiert noch nicht – nichts gelöscht."
  exit 0
fi
mapfile -t old < <(gh release list --limit 200 --json tagName,createdAt,isDraft |
  jq -r --argjson keep "$keep" '[.[] | select(.isDraft | not) | select(.tagName | test("^v[0-9]+\\.[0-9]+\\.[0-9]+$"))]
                                 | sort_by(.createdAt) | reverse | .[$keep:] | .[].tagName')
if [ "${#old[@]}" -eq 0 ]; then echo "Nichts zu löschen (höchstens $keep Releases vorhanden)."; exit 0; fi
for tag in "${old[@]}"; do
  echo "Lösche altes Release $tag"
  gh release delete "$tag" --cleanup-tag --yes
done
