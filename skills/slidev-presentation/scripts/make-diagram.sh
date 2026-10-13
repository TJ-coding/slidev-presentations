#!/usr/bin/env bash
# Spawn a headless pi sub-session that builds one figure for a deck, using the
# diagram-skills repo (d3-diagrams or tikz-diagrams) as the sub-session's only skill.
#
# Usage:
#   make-diagram.sh <deck-dir> <d3|tikz> <slug> "MESSAGE sentence | data/structure notes"
# Options:
#   --formats svg,png   passed through to the diagram render pipeline (default svg,png)
#   --dark              request both themes (only for dark decks)
# Env:
#   DIAGRAM_SKILLS      path to the diagram-skills repo (default ~/Projects/diagram-skills)
set -euo pipefail

DIAGRAM_SKILLS="${DIAGRAM_SKILLS:-$HOME/Projects/diagram-skills}"
DECK="${1:?Usage: make-diagram.sh <deck-dir> <d3|tikz> <slug> \"MESSAGE | notes\" [--formats f1,f2] [--dark]}"
ENGINE="${2:?}"
SLUG="${3:?}"
BRIEF="${4:?}"
shift 4

FORMATS="svg,png"
DARK=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --formats) FORMATS="$2"; shift 2 ;;
    --dark) DARK=1; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

case "$ENGINE" in
  d3|tikz) ;;
  *) echo "Engine must be d3 or tikz" >&2; exit 1 ;;
esac

DECK_DIR="$(cd "$DECK" && pwd)"
OUT_DIR="$DECK_DIR/public/diagrams/$SLUG"
SKILL_DIR="$DIAGRAM_SKILLS/skills/$ENGINE-diagrams"
[[ -d "$SKILL_DIR" ]] || { echo "Skill not found: $SKILL_DIR" >&2; exit 1; }
mkdir -p "$OUT_DIR"

THEME_NOTE="light background only (the deck theme is light)"
if [[ "$DARK" == 1 ]]; then
  THEME_NOTE="render both themes (--both-themes); the deck also uses a dark variant"
fi

PROMPT=$(cat <<EOF
You are a focused diagram sub-session. Follow the loaded skill end to end.

MESSAGE: $BRIEF

VENUE: static figure for a presentation slide (Slidev, GOV.UK style), $THEME_NOTE.
Text in the figure must be legible at deck scale (>=16px at 100%); prefer a wide
layout (~1400x700) unless the caller says otherwise.

OUTPUT: your working directory is the final output directory, $OUT_DIR.
Scaffold HERE: d3 → run "$SKILL_DIR/scripts/new-diagram.sh" "$SLUG" . ;
tikz → run "$SKILL_DIR/scripts/new-diagram.sh" "$SLUG" .
(their render/build scripts write into ./out/). Render/export with formats:
$FORMATS (png at 2x or higher). Keep every artefact inside this directory, and
when done COPY the final deliverables (diagram.svg, diagram.png) to this
directory root so the stable slide paths are $OUT_DIR/diagram.svg and
$OUT_DIR/diagram.png. Touch nothing outside this directory.

When done, reply with ONLY the list of written file paths (relative to $OUT_DIR)
and one line per file saying what it shows.
EOF
)

echo "→ Spawning $ENGINE-diagrams sub-session → $OUT_DIR"
( cd "$OUT_DIR" && pi --no-session --print -ns \
    --skill "$SKILL_DIR" \
    --tools read,bash,edit,write \
    "$PROMPT" )
