#!/usr/bin/env bash
# Phase 3 Group 1 — DB migration + fix_comments accessors
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run db
