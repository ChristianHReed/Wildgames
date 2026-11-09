#!/bin/sh
# Afterstreet on a Mac: double-click. Chromium-family browsers get an app window; else Firefox; else Safari.
DIR="$(cd "$(dirname "$0")/.." && pwd)"; URL="file://$DIR/play.html$1"
for a in "Chromium" "Google Chrome" "Microsoft Edge" "Brave Browser"; do
  if [ -d "/Applications/$a.app" ]; then open -na "$a" --args --app="$URL"; exit 0; fi
done
if [ -d "/Applications/Firefox.app" ]; then open -a Firefox "$URL"; exit 0; fi
open "$URL"
