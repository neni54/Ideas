#!/usr/bin/env bash
# End-to-end test of the AI server against a fake OpenAI/Anthropic upstream (no real keys, no cost).
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
trap 'kill $(jobs -p) 2>/dev/null || true; rm -rf "$TMP"' EXIT
ffmpeg -loglevel error -f lavfi -i "sine=frequency=330:duration=2" -ac 1 -b:a 48k "$TMP/tone.mp3"
: > "$TMP/log.jsonl"
MOCK_PORT=19999 node tests/mock-upstream.mjs "$TMP/log.jsonl" "$TMP/tone.mp3" &
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY PORT=18788 OPENAI_API_KEY=test ANTHROPIC_API_KEY=test \
  OPENAI_BASE_URL=http://localhost:19999/v1 ANTHROPIC_API_BASE=http://localhost:19999 TTS_CACHE_DIR="$TMP/cache" node server/index.mjs >/dev/null &
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY PORT=18789 TTS_CACHE_DIR="$TMP/cache2" node server/index.mjs >/dev/null &
sleep 1
node tests/api.test.mjs "$TMP/log.jsonl" "$TMP/tone.mp3"
