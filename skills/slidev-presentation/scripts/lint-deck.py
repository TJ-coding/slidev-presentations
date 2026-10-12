#!/usr/bin/env python3
"""Report visual-hierarchy problems in a Slidev deck built from this template.

Usage: lint-deck.py [slides.md]   (default: ./slides.md)

Per-slide checks:
  1. layout set and known (typos silently fall back to a default)
  2. govuk slides carry frontmatter `title:`
  3. govuk content slides carry a `lead:` takeaway (the focal point)
  4. no markdown `# heading` in content layouts (duplicates the band title)
  5. speaker notes present (HTML comments)
  6. bullets <= 5
  7. govuk-emph spans <= 2 (emphasis budget)
  8. govuk-panel boxes <= 2
  9. at most one focal anchor (govuk-lead / govuk-takeaway)

Exit 0 = clean, 1 = warnings.
"""
from __future__ import annotations

import re
import sys

KNOWN_LAYOUTS = {
    "govuk", "govuk-cover", "govuk-section", "govuk-two-cols",
    "govuk-image-right", "govuk-end", "default", "center", "section", "two-cols",
}
CONTENT_LAYOUTS = {"govuk", "govuk-two-cols", "govuk-image-right", "govuk-end"}

SEP = re.compile(r"-{3,}\s*$")
KEY = re.compile(r"^\s*([\w-]+)\s*:\s*(.*)$")


def split_slides(lines: list[str]) -> list[tuple[list[str], list[str]]]:
    """Split slides.md into [(frontmatter_lines, body_lines), ...].

    Rules:
    - the first `---` at file start OPENS the headmatter, the next `---` closes it
    - any other `---` followed by a `key: value` line opens a new slide's
      frontmatter; a `---` while frontmatter is open closes it
    - all other `---` lines are plain slide separators
    """
    slides: list[tuple[list[str], list[str]]] = [([], [])]
    head_open = True           # the leading `---` is still to come
    fm_open = False            # current slide is inside frontmatter

    for i, line in enumerate(lines):
        if SEP.match(line):
            if head_open:
                head_open = False
                fm_open = True
                continue
            if fm_open:
                fm_open = False
                continue
            nxt = next((l for l in lines[i + 1:] if l.strip()), "")
            fm, body = slides[-1]
            slides[-1] = (fm, body)
            slides.append(([], []))
            if KEY.match(nxt):
                fm_open = True
            continue
        fm, body = slides[-1]
        target = fm if fm_open else body
        target.append(line)
        slides[-1] = (fm, body)
    return slides


def parse_block(block: tuple[list[str], list[str]]) -> tuple[dict, str]:
    fm_lines, body_lines = block
    fm = {}
    for line in fm_lines:
        m = KEY.match(line)
        if m:
            fm[m.group(1)] = m.group(2).strip().strip("'\"")
    return fm, "\n".join(body_lines)


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else "slides.md"
    lines = open(path, encoding="utf-8").read().splitlines()
    slides = split_slides(lines)

    total_warn = 0
    for idx, block in enumerate(slides, 1):
        fm, body = parse_block(block)
        layout = fm.get("layout", "")
        problems: list[str] = []

        if not layout:
            problems.append("no layout: set a govuk-* layout explicitly")
        elif layout not in KNOWN_LAYOUTS:
            problems.append(f'unknown layout "{layout}" — check for typos')

        if layout == "govuk" and not fm.get("title"):
            problems.append("govuk slide without frontmatter title:")

        if layout == "govuk" and not fm.get("lead"):
            problems.append("no lead: takeaway — viewer has no idea what to focus on (add lead:)")

        if layout in CONTENT_LAYOUTS and re.search(r"(?m)^# ", body):
            problems.append("markdown `# heading` found — titles belong in frontmatter title:; the black band renders them")

        if layout != "govuk-section" and "<!--" not in body:
            problems.append("no speaker notes (<!-- ... -->)")

        bullets = len(re.findall(r"(?m)^[-*]\s", body))
        if bullets > 5:
            problems.append(f"{bullets} bullets — cut to ≤5 or split the slide")

        emph = body.count("govuk-emph")
        if emph > 2:
            problems.append(f"{emph} govuk-emph spans — emphasis budget is ≤2 red/green terms per slide")

        panels = len(re.findall(r"govuk-panel(?![-\w])", body))
        if panels > 2:
            problems.append(f"{panels} govuk-panel boxes — ≤2 callouts per slide")

        anchors = body.count("govuk-lead") + body.count("govuk-takeaway")
        if anchors > 1:
            problems.append("multiple focal anchors — pick ONE per slide")

        if problems:
            print(f"  slide {idx} [{layout or 'no-layout'}]")
            for p in problems:
                print(f"    - {p}")
            total_warn += len(problems)

    if total_warn == 0:
        print(f"PASS: {path} — hierarchy checks clean ({len(slides)} slides)")
        return 0
    print(f"WARN: {path} — {total_warn} issue(s) across {len(slides)} slides")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
