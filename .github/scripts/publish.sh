#!/usr/bin/env bash
# Legt das Release v$VERSION an (falls noch nicht vorhanden) und lädt die übergebenen Dateien hoch.
# Windows- und Linux-Job laufen parallel; wer zuerst fertig ist, legt das Release an.
set -euo pipefail
tag="v$VERSION"
notes=".github/release-notes/$tag.md"
if ! gh release view "$tag" --json url > /dev/null 2>&1; then
  if [[ -f "$notes" ]]; then args=(--notes-file "$notes"); else args=(--generate-notes); fi
  gh release create "$tag" --target "$GITHUB_SHA" --title "JellyDrax $VERSION" "${args[@]}" \
    || echo "Release wurde gleichzeitig vom anderen Job angelegt."
fi
for i in 1 2 3; do
  gh release upload "$tag" "$@" --clobber && exit 0
  sleep $((i * 10))
done
exit 1
