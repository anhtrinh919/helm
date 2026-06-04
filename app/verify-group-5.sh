#!/usr/bin/env bash
# Group 5 verify: strict typecheck + orchestrator/DB unit tests + renderer build.
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── unit tests (DB + session orchestrator) ──"
npx vitest run

echo "── renderer build (web target) ──"
npx vite build --config vite.web.config.ts
echo "build OK"
