#!/usr/bin/env python3
"""check-plan.py — verify a deck's plan.md matches slides.md (plan-first gate).

Usage: check-plan.py <deck-dir|slides.md>

Checks:
  1. plan.md exists next to slides.md (or in the deck dir).
  2. Every slide in slides.md has a row in the plan's slide table.
  3. Plan rows and slides agree on count and titles (lenient match).
Exit 1 on any failure. Run it as part of the quality gate, next to lint-deck.py.
"""
import re
import sys
from pathlib import Path


def norm(s: str) -> str:
    s = s.strip().strip('`"\'').strip()
    s = re.sub(r"<[^>]+>", "", s)          # strip inline html in titles
    s = re.sub(r"[\s\u00a0]+", " ", s)     # collapse whitespace
    return s.casefold().rstrip(".")


def load_plan(path: Path):
    rows, in_slides = [], False
    for line in path.read_text().splitlines():
        if line.startswith("## "):
            in_slides = line[3:].strip().lower().startswith("slides")
            continue
        if in_slides and re.match(r"^\|\s*\d+\s*\|", line):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 4 and cells[0].isdigit():
                rows.append({"n": int(cells[0]), "title": norm(cells[2]),
                             "message": cells[3], "intention": cells[4]})
    return rows


def load_slides(path: Path):
    """Yield (slide_index, title) for each Slidev slide with frontmatter."""
    text = path.read_text()
    blocks = re.split(r"^---\s*$", text, flags=re.M)
    slides, n = [], 0
    for block in blocks:
        lines = block.splitlines()
        if not lines or lines[0].strip() != "":
            # a slide block starts with an empty first line? no — frontmatter
            # blocks begin right after a --- separator; slidev separators are
            # the split points themselves, so each block may start with FM.
            pass
        m = re.search(r"^title:\s*(.+?)\s*$", block, flags=re.M)
        if m and not m.group(1).startswith("#"):
            n += 1
            slides.append({"n": n, "title": norm(m.group(1))})
    return slides


def main() -> int:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    arg = Path(sys.argv[1])
    slides_md = arg if arg.name == "slides.md" else arg / "slides.md"
    if not slides_md.exists():
        sys.exit(f"check-plan: {slides_md} not found")
    deck = slides_md.parent
    plan = deck / "plan.md"
    if not plan.exists():
        sys.exit(f"FAIL: {plan} missing — write the plan before slides "
                 f"(references/planning.md)")

    slides, rows = load_slides(slides_md), load_plan(plan)
    fails = []

    if not rows:
        fails.append("plan.md has no slide rows in its '## Slides' table")

    row_titles = {r["title"] for r in rows}
    for s in slides:
        if not any(s["title"] == t or t in s["title"] or s["title"] in t
                   for t in row_titles if t):
            fails.append(f"slide {s['n']} ('{s['title']}') has no plan row")

    slide_titles = {s["title"] for s in slides}
    for r in rows:
        if r["title"] and not any(r["title"] == t or t in r["title"] or r["title"] in t
                                  for t in slide_titles if t):
            fails.append(f"plan row {r['n']} ('{r['title']}') has no slide")

    if len(rows) != len(slides):
        fails.append(f"count mismatch: {len(slides)} slides vs {len(rows)} plan rows")

    if fails:
        print("FAIL: plan.md is out of sync with slides.md")
        for f in fails:
            print(f"  - {f}")
        return 1
    print(f"PASS: plan.md covers all {len(slides)} slides (titles match)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
