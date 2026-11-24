#!/usr/bin/env bash
# Mobile end-to-end tests: real server + fake AI upstream + Playwright (Chromium) with phone emulation.
#   bash tests/run-mobile-tests.sh            # all devices
#   DEVICES="iPhone SE" bash tests/run-mobile-tests.sh
# Needs Playwright with Chromium available to Node (require('playwright')) and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
trap 'kill $(jobs -p) 2>/dev/null || true; rm -rf "$TMP"' EXIT
[ "${SKIP_BUILD:-}" = 1 ] || npm run build >/dev/null
ffmpeg -loglevel error -f lavfi -i "sine=frequency=330:duration=1" -ac 1 -b:a 48k "$TMP/tone.mp3"
: > "$TMP/log.jsonl"
MOCK_PORT=19998 node tests/mock-upstream.mjs "$TMP/log.jsonl" "$TMP/tone.mp3" >/dev/null &
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY PORT=18790 OPENAI_API_KEY=test ANTHROPIC_API_KEY=test \
  OPENAI_BASE_URL=http://localhost:19998/v1 ANTHROPIC_API_BASE=http://localhost:19998 TTS_CACHE_DIR="$TMP/cache" node server/index.mjs >/dev/null &
for _ in $(seq 50); do curl -sf localhost:18790/api/status >/dev/null && break; sleep 0.2; done
BASE=http://localhost:18790 OUT="${OUT:-$TMP/shots}" node tests/mobile.e2e.mjs
