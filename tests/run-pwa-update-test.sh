#!/usr/bin/env bash
# Checks the PWA update flow end to end (see tests/pwa-update.e2e.mjs). Rebuilds dist/ twice.
set -euo pipefail
cd "$(dirname "$0")/.."
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT
npm run build >/dev/null
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY PORT=18795 node server/index.mjs >/dev/null &
for _ in $(seq 50); do curl -sf localhost:18795/api/status >/dev/null && break; sleep 0.2; done
BASE=http://localhost:18795 node tests/pwa-update.e2e.mjs
