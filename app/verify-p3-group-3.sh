#!/usr/bin/env bash
# Phase 3 Group 3 — PointCaptureService unit tests
set -euo pipefail
cd "$(dirname "$0")"
npx tsc --noEmit -p tsconfig.json
npx vitest run point-capture-service
