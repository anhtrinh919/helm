#!/usr/bin/env bash
# Phase 3 Group 8 — integration gate: typecheck + full test suite + production build
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run
npx electron-vite build
