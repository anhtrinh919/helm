#!/usr/bin/env bash
# Phase 3 Group 4 — fix-session orchestration (queue, prompt, retry)
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run fix-session
