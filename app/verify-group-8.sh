#!/usr/bin/env bash
# Group 8 verify: full strict typecheck + every unit test (incl. IPC validation
# hardening + live decision detection) + production renderer build.
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── full unit suite ──"
npx vitest run

echo "── plain-language gate (no jargon/IDs/model names in renderer) ──"
! grep -rniE "coming soon|tool_use|write_file|read_file|\bopus\b|\bsonnet\b|phase [0-9]+ ?/ ?[0-9]+" src/renderer/src --include="*.tsx" --include="*.ts" \
  || { echo "PLAIN-LANGUAGE GATE FAILED"; exit 1; }
echo "plain-language gate OK"

echo "── renderer build (web target) ──"
npx vite build --config vite.web.config.ts
echo "build OK"
