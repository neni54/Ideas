#!/usr/bin/env bash
# SIDEYE TOKENS / EXTRA CHANCE / THE BADGE SHOP end-to-end tests (Playwright, phone viewport).
set -euo pipefail
cd "$(dirname "$0")/.."
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT
[ "${SKIP_BUILD:-}" = 1 ] || npm run build >/dev/null
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY PORT=18796 node server/index.mjs >/dev/null &
for _ in $(seq 50); do curl -sf localhost:18796/api/status >/dev/null && break; sleep 0.2; done
BASE=http://localhost:18796 OUT="${OUT:-.}" node tests/tokens.e2e.mjs
