#!/usr/bin/env bash
# Start the Slidev dev server for a deck, detached.
# Uses tmux if available (survives shell exit), falls back to nohup.
# Usage: serve.sh <deck-dir>
set -euo pipefail
DIR="${1:?Usage: serve.sh <deck-dir>}"
cd "$DIR"

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..." >&2
  npm install --silent
fi

SESSION="slidev-$(basename "$DIR")"

# Kill any previous instance of this deck's server
tmux has-session -t "$SESSION" 2>/dev/null && tmux kill-session -t "$SESSION" || true

CMD="npx slidev --force"

if command -v tmux >/dev/null 2>&1; then
  # Start in editor-agnostic detached session; wait for port to be live
  tmux new-session -d -s "$SESSION" "cd '$DIR' && $CMD 2>&1 | tee .slidev-dev.log"
  echo $SESSION > .slidev-dev.tmux
  for i in $(seq 1 30); do
    sleep 1
    if curl -s -o /dev/null http://localhost:3030/; then
      echo "✅ Dev server up: http://localhost:3030 (tmux session: $SESSION)"
      echo "   stop: tmux kill-session -t $SESSION"
      exit 0
    fi
  done
  echo "⏳ Server still starting after 30s. Check: tmux attach -t $SESSION, or $DIR/.slidev-dev.log" >&2
  exit 1
else
  nohup $CMD > .slidev-dev.log 2>&1 &
  echo $! > .slidev-dev.pid
  sleep 5
  echo "✅ Dev server starting: http://localhost:3030 (pid $(cat .slidev-dev.pid))"
  echo "   log: $DIR/.slidev-dev.log  |  stop: kill \$(cat $DIR/.slidev-dev.pid)"
fi
