#!/usr/bin/env bash
# Start the Slidev dev server for a deck, detached, logging to .slidev-dev.log
# Usage: serve.sh <deck-dir>
set -euo pipefail
DIR="${1:?Usage: serve.sh <deck-dir>}"
cd "$DIR"

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..." >&2
  npm install --silent
fi

nohup npm run dev -- --force > .slidev-dev.log 2>&1 &
echo $! > .slidev-dev.pid
sleep 3
if kill -0 "$(cat .slidev-dev.pid)" 2>/dev/null; then
  echo "✅ Dev server running: http://localhost:3030 (pid $(cat .slidev-dev.pid))"
  echo "   log: $DIR/.slidev-dev.log  |  stop: kill \$(cat $DIR/.slidev-dev.pid)"
else
  echo "❌ Failed to start; last log lines:" >&2
  tail -n 20 .slidev-dev.log >&2
  exit 1
fi
