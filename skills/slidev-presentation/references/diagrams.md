# Delegating figures to diagram sub-sessions

The `govuk-*` primitives (`gov-flow`, `gov-matrix`, `gov-contrast`, `gov-bignum`) and
`mermaid` cover most conceptual slides. When a slide needs a **real figure** — a data
plot, a precise schematic, a network/timeline that mermaid cannot draw well — build it
with the skills in `~/Projects/diagram-skills` by spawning a **headless pi sub-session**,
not by hand-rolling SVG inside `slides.md`.

## When to delegate

Delegate when ANY of these is true:

- The figure is a **data plot** (bar, line, scatter, heatmap, distribution) — `gov-*`
  primitives cannot encode scales honestly.
- The figure needs **typeset math** or precise schematic placement → TikZ.
- The figure needs D3 features mermaid lacks (scales, custom marks, colour mapping).
- The figure will also live in a paper → reuse the diagram-skills pipeline so both
  match (`references/design-standards.md` there is the shared visual language).

Do NOT delegate when a `gov-*` component or mermaid does the job — native primitives
match the deck's typography and need no render step.

## The sub-session contract

Run via the wrapper (recommended):

```bash
./scripts/make-diagram.sh <deck-dir> d3 "MESSAGE-SENTENCE | data notes..." [--formats svg,png]
./scripts/make-diagram.sh <deck-dir> tikz "MESSAGE-SENTENCE | description..." [--formats svg,png]
```

Or spawn pi directly (what the wrapper does):

```bash
cd <deck-dir>/public/diagrams/<slug>
pi --no-session --print -ns \
   --skill "$HOME/Projects/diagram-skills/skills/d3-diagrams" \
   --tools read,bash,edit,write \
   "MESSAGE: <claim>. DATA/STRUCTURE: ... . VENUE: presentation slide,
    light background, wide (>=1200x700). OUTPUT: write diagram.svg/png into
    <cwd> and nothing else."
```

Key flags: `--no-session` (no session files), `-ns` (no auto-discovered skills — only
the one skill loads, so the sub-session is a focused diagram worker), `--tools`
(minimal file tools). `--skill <dir>` explicitly loads the d3 or tikz skill's full
instructions — this is the modularity: each figure is built by a fresh session whose
*only* loaded skill is the diagram skill.

### What the caller must give the sub-session

1. **The message** — one claim sentence, same discipline as the deck's `lead:` lines.
   The sub-session's step 1 requires it.
2. **Output directory** — always `<deck-dir>/public/diagrams/<slug>/` (absolute path).
   Assets under `public/` are referenced in `slides.md` as `/diagrams/<slug>/file.png`.
3. **Data or structure** — inline in the prompt; never make the sub-session hunt for it.
4. **Venue** — "presentation slide, light background". Ask for `--both-themes` only if
   the deck uses a dark theme.

### What comes back

The sub-session writes only into the output directory and reports the written paths.
The caller then:

1. Verifies the files exist (`ls`) and sanity-checks the PNG by reading it.
2. Embeds it: a `govuk-image-right` slide with `image: /diagrams/<slug>/diagram.png`,
   or a plain `![](/diagrams/<slug>/diagram.png)`.
3. Runs the normal deck lint + export gate.

## Styling contract

- Diagram figures keep the **diagram-skills colourblind-safe palette**
  (`docs/design-standards.md` in diagram-skills). Do not restyle them to GOV.UK
  accents by editing the SVG by hand — if a colour must change, re-render.
- Ink/text in the figure is near-black, which already matches the GOV.UK band
  (`#0b0c0c`), so light-background figures sit cleanly on deck slides.
- One figure = one message = one slide's focal point. Never decorate a slide
  with a figure that duplicates its bullets — per the design doctrine, the figure
  replaces the bullets.

## Cost/latency notes

A sub-session is a full agent run (typically 1–5 minutes). Batch figures: if a deck
needs several, spawn one sub-session per figure in parallel (background them), or give
one sub-session a multi-figure prompt when the figures share data. Run
`make-diagram.sh` detached when batching so you can keep editing `slides.md` meanwhile.
