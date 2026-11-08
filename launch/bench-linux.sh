#!/bin/sh
# Afterstreet benchmark, unattended (see bench-windows.bat). Usage: ./bench-linux.sh "Beelink mini"
NAME="${1:-$(hostname)}"
exec "$(dirname "$0")/play-linux.sh" "?bench&send=1&close=1&label=$(printf %s "$NAME" | sed 's/ /%20/g')"
