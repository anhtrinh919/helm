#!/usr/bin/env bash
# Group 2 verify: strict typecheck + DB unit tests.
set -euo pipefail
cd "$(dirname "$0")"

echo "── typecheck (strict) ──"
npx tsc --noEmit -p tsconfig.json
echo "typecheck OK"

echo "── persistence unit tests ──"
npx vitest run
