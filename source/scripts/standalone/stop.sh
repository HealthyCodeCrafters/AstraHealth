#!/usr/bin/env bash
# Stop the local ASTRA server (macOS / Linux).
PID=$(lsof -ti tcp:"${PORT:-8080}" 2>/dev/null || true)
if [ -z "$PID" ]; then
  echo "ASTRA is not running."
else
  kill $PID
  echo "ASTRA stopped."
fi
