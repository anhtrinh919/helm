#!/usr/bin/env bash
# Group 9 verify: strict typecheck + full unit suite + plain-language gate +
# production web build + the real preview-pipeline smoke (spawn + HTTP probe).
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

echo "── production build (electron-vite) ──"
npx electron-vite build
echo "build OK"

echo "── preview pipeline smoke (real dev server + probe) ──"
npx tsx scripts/verify-group-9.ts
echo "smoke OK"

echo ""
echo "✓ Group 9 passed — Phase 2 verification green."
