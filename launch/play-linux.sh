#!/bin/sh
# Afterstreet: opens play.html from this drive. Chromium-family browsers get an app window (no address bar); else Firefox; else the default browser.
# Kiosk (full screen, for a Pi or a handheld): KIOSK=1 ./play-linux.sh
DIR="$(cd "$(dirname "$0")/.." && pwd)"; URL="file://$DIR/play.html$1"
for b in chromium chromium-browser google-chrome brave-browser microsoft-edge; do
  if command -v "$b" >/dev/null 2>&1; then
    if [ -n "$KIOSK" ]; then exec "$b" --kiosk --noerrdialogs --disable-session-crashed-bubble "$URL"; else exec "$b" --app="$URL"; fi
  fi
done
if command -v firefox >/dev/null 2>&1; then if [ -n "$KIOSK" ]; then exec firefox --kiosk "$URL"; else exec firefox "$URL"; fi; fi
exec xdg-open "$URL"
