#!/usr/bin/env bash
# Phase 3 Group 2 — IPC schemas + bridges for point-and-fix channels
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run ipc-validation
