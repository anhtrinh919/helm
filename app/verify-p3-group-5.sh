#!/usr/bin/env bash
# Phase 3 Group 5 — renderer overlay, comment box, pins
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run pins
