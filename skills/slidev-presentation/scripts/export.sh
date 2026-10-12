#!/usr/bin/env bash
# Export a deck. Usage: export.sh <deck-dir> [pdf|pptx|png|spa] [extra args...]
set -euo pipefail
DIR="${1:?Usage: export.sh <deck-dir> [pdf|pptx|png|spa]}"
FMT="${2:-pdf}"
shift 2 || true
cd "$DIR"

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..." >&2
  npm install --silent
fi

case "$FMT" in
  spa|build)
    npm run build "$@"
    echo "✅ SPA built → $DIR/dist"
    ;;
  *)
    # First playwright chromium run may need: npx playwright install chromium
    # --per-slide: global layers with nav state (page numbers) render correctly
    npx slidev export --format "$FMT" --output "slides.$FMT" --per-slide "$@"
    echo "✅ Exported → $DIR/slides.$FMT"
    ;;
esac
