---
name: slidev-presentation
description: Create, edit, and export Slidev presentations in a Quiet GOV.UK-inspired deck kit. Use when the user asks to make, update, or polish slides, a deck, a talk, or a presentation — but not for PowerPoint/.pptx editing (use powerpoint-live-editing skill for that).
---

# Slidev presentations — the Quiet kit

## When to use
- User asks for "slides", "a deck", "a talk", "a presentation" and web-based output is fine → use this skill.
- PowerPoint/.pptx live editing → `powerpoint-live-editing` skill; this kit can still export .pptx.

## Setup

```bash
./scripts/new-deck.sh "Talk Title" <deck-dir>   # scaffolds from template/ — never edit template in place
./scripts/serve.sh <deck-dir>                    # dev server on :3030, hot reload
./scripts/export.sh <deck-dir> pdf|pptx|png|spa  # pdf is the default deliverable
```

Check for competing decks on :3030 first (a stale demo server serves the wrong
deck): `lsof -ti :3030` — kill foreign owners and restart via `serve.sh`.

## Plan first — mandatory, before any slide

Write `<deck>/plan.md` (skeleton in `template/plan.md`) and get approval:

1. **Brief** — audience, duration (→ slide budget), exit sentence. If you can't
   write it, interview the user first.
2. **Story** — one paragraph in claims + question ladder.
3. **Slide contract** — one row per slide: layout, title, message (becomes the
   `lead:` verbatim), intention. Reading intentions must read as the story.

Show the plan, wait for approval, then implement row by row. Keep plan and deck
in sync: update the row first, then the slide (`scripts/check-plan.py`).

## Slide rules — summary

The full contract is `references/design-guidelines.md`. The laws:

- **One focal point** per slide — the lead; everything else supports it.
- **Show, don't tell** — draw with the component kit; prose goes to speaker notes.
- **Maximum type** — enlarge until hierarchy breaks, then shorten the text.
- **Connectors are semantics** — `→` moves data (value above, name below),
  `▼` concludes, `+ = ×` is arithmetic. Never mix.
- **Budgets** (enforced by `scripts/lint-deck.py`): one lead/takeaway, ≤2 emph
  spans, ≤2 panels, ≤5 bullets, speaker notes on every slide.

## Component cookbook

Props, usage, and rendered look of every component:
**`references/components.md`** — GovArrow, GovBox, GovTriangle, GovChain,
GovPipe, GovStress, GovWindow (pop-up window chrome), GovDerivation (animated
equation morphs, ledger sections), TikzSync (animated TikZ insets on the slide
clock), the settings footer, the click-driven playback pattern, and the `dd`
pair layout. Layout frontmatter (cover `name`/`jpTitle`, `govuk-about`
self-introduction, `govuk-section` progress rail via `sections:`) is in
`references/slidev-syntax.md`. Use the components instead of raw
CSS classes; they embed the animations and hierarchy rules.

## Animated TikZ insets

Schematics that build up click by click beside a derivation: write
`<deck>/tikz/src/<name>.tex`, run `npm run build:tikz`, place
`<TikzSync name="<name>" />` inside `.tikz-inset`. Follow the animation rules in
`template/tikz/src/README.md` (fade-only, one change per click, fixed layout).

## Live D3 figures (animated, click-driven)

When a slide needs an animated D3 figure whose stages advance with the deck's
→/← keys: `references/d3-live-figures.md` — the figure-side embedder contract
(`template/snippets/d3-figure-embedder.js`), the generic slide-side embedder
`template/components/D3Figure.vue`, the print/PDF fallback, and the headless
verification loop (`scripts/drive-figure.mjs`). Static figures are covered by
`references/diagrams.md` instead.

Two laws matter beyond the figure itself: at most one playback at a time, and
no module-level render state (presenter mode mounts the figure several times per
window). Both bugs looked like sync failures in acl26 — see the reference.

## Presenter mode, audience windows, multi-tab sync

The template ships `setup/main.ts`, which fixes stock Slidev's sync gaps
(viewer↔viewer never follows; the viewer echo can lose or rewind clicks):
one-way server flow + a same-origin BroadcastChannel bus + hello/nav handshake
so tabs opened mid-talk join the live position. Copy it into any existing deck
(`setup/main.ts`, auto-loaded by Slidev).

Before presenting live, from the deck dir:

```bash
node <kit>/scripts/check-sync.mjs http://localhost:3030/<first-figure-slide>
```

It asserts presenter ↔ audience ↔ tab sync, rapid-click resilience under CPU
throttling, late join, and viewer-only mode. Operational rules (one server per
deck, one origin for all windows, restart after editing `setup/`) and the
failure modes are in **`references/presenting.md`**.

## Quality gate

Before delivering a deck, all three must pass:

```bash
scripts/lint-deck.py  <deck>/slides.md
scripts/check-plan.py <deck>
scripts/export.sh     <deck> pdf        # succeeds, no missing images
```

## pi setup

```bash
ln -sfn <this-dir> ~/.pi/agent/skills/slidev-presentation
```

Submodule consumers: symlink `~/.pi/agent/skills/slidev-presentation` to
`<deck-repo>/kit/skills/slidev-presentation`.
- Full human-readable docs (GitHub Pages): https://tj-coding.github.io/slidev-presentations/
