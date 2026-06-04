#!/usr/bin/env bash
# Group 1 verify: strict typecheck + a real SDK streaming proof.
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── engine-plumbing proof (live SDK session) ──"
npx tsx scripts/verify-group-1.ts
