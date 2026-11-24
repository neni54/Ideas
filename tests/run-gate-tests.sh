#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
npx esbuild tests/gate.test.ts --bundle --platform=node --format=esm --outfile="$OUT/gate.mjs" --log-level=error
for tz in Europe/Madrid America/New_York Asia/Tokyo Pacific/Auckland UTC; do TZ=$tz node "$OUT/gate.mjs" | tail -1 | sed "s#^#$tz: #"; done
