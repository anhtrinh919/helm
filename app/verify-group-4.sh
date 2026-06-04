#!/usr/bin/env bash
# Group 4 verify: strict typecheck + production renderer build (board compiles).
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── renderer build (web target) ──"
npx vite build --config vite.web.config.ts
echo "build OK"
