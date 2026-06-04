#!/usr/bin/env bash
# Group 7 verify: strict typecheck + decision/reopen unit tests + renderer build.
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── unit tests (incl. answerDecision + reopen) ──"
npx vitest run

echo "── renderer build (web target) ──"
npx vite build --config vite.web.config.ts
echo "build OK"
