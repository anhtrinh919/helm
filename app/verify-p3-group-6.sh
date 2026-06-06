#!/usr/bin/env bash
# Phase 3 Group 6 — board REPORTED section + fix-comment cards
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run board
