#!/usr/bin/env bash
# SIDEYE levels: unit checks + iPhone end-to-end checks.
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes tsx --tsconfig tsconfig.json tests/levels.test.ts
[ "${SKIP_BUILD:-}" = 1 ] || npm run build >/dev/null
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY PORT=18797 node server/index.mjs >/dev/null &
for _ in $(seq 50); do curl -sf localhost:18797/api/status >/dev/null && break; sleep 0.2; done
BASE=http://localhost:18797 OUT="${OUT:-.}" node tests/levels.e2e.mjs
