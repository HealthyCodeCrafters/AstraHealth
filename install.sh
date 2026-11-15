#!/usr/bin/env bash
# ASTRA standalone installer (macOS / Linux)
set -e
cd "$(dirname "$0")"

echo "=== ASTRA standalone installer ==="

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but not installed."
  echo "Install Node.js 18 or newer from https://nodejs.org and run this script again."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18 or newer is required (found $(node --version))."
  exit 1
fi

echo "Node.js $(node --version) found."
echo "No packages to install — the app is pre-built and the server has zero dependencies."
echo "Run ./start.sh to launch ASTRA."
