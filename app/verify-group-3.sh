#!/usr/bin/env bash
# Group 3 verify: strict typecheck + production build (main + preload + renderer).
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── production build ──"
npx electron-vite build
