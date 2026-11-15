#!/usr/bin/env bash
# Start ASTRA locally (macOS / Linux). Works with no internet connection.
cd "$(dirname "$0")"
PORT="${PORT:-8080}"
echo "Starting ASTRA on http://localhost:$PORT ..."
( sleep 1; open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null ) &
PORT=$PORT node server.mjs
