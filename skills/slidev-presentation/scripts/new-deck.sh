#!/usr/bin/env bash
# Scaffold a new Slidev deck from the template.
# Usage: new-deck.sh "Talk Title" [target-dir]
set -euo pipefail

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../template && pwd)"
TITLE="${1:?Usage: new-deck.sh \"Talk Title\" [target-dir]}"
TARGET="${2:-$(pwd)/$(echo "$TITLE" | tr '[:upper:] ' '[:lower:]-')}"
DECK_NAME="$(basename "$TARGET")"

if [[ -e "$TARGET" ]]; then
  echo "Error: $TARGET already exists" >&2
  exit 1
fi

mkdir -p "$TARGET"
rsync -a --exclude node_modules --exclude dist --exclude .slidev-dev.log "$TEMPLATE_DIR/" "$TARGET/"

# Rewrite the deck title in slides.md (first `# ` heading and frontmatter title)
sed -i '' "s/^# Presentation Title.*/# $TITLE ✨/" "$TARGET/slides.md"
sed -i '' "s/^title: .*/title: '$TITLE'/" "$TARGET/slides.md"

# Install deps (skip if user passes --no-install as 3rd arg)
if [[ "${3:-}" != "--no-install" ]]; then
  (cd "$TARGET" && npm install --silent)
fi

echo "✅ New deck ready: $TARGET"
echo "   dev:    cd $TARGET && npm run dev"
echo "   export: npm run export:pdf"
