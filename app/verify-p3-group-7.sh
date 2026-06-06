#!/usr/bin/env bash
# Phase 3 Group 7 — checkpoint approve/reject wiring for fix sessions
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run fix-session feed-fix
