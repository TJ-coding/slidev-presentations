# Deck design — the visual-hierarchy doctrine

The template adapts GOV.UK (colour, typography, components) to the structure of
the user's reference decks. But structure is worthless without hierarchy: **a slide
fails if the viewer cannot tell, in one second, what to look at first, what is
evidence, and what to remember.** This document is the design contract.

## The two laws

> **One focal point.** Every slide has exactly ONE anchor — the lead. Everything
> else is arranged in roles around it. If two elements compete, one does not
> belong on the slide.
>
> **Show, don't tell.** If the idea has structure, draw it. Diagrams are the
> default body; text exists to LABEL a diagram, never to replace one. Every
> sentence you can delete without breaking the diagram gets deleted.

The user's reference decks are built this way: pipelines are arrows between
boxes, comparisons are columns of colour-coded boxes, results are highlighted
cells in a score matrix. Your job is to reconstruct that picture, minimally.

## Reading-order patterns

| Content | Pattern | Enforcer |
| --- | --- | --- |
| A statement + its proof | lead sentence, then evidence below/right | `lead:` + body |
| A pipeline / algorithm | numbered steps, top→bottom | `govuk-steps` |
| Comparison (2 things) | left = the argument (what we claim), right = the evidence (numbers/code/figure) | `govuk-two-cols`, named `::right::` |
| A system/diagram | figure large + one-sentence lead + provenance caption | `govuk-image-right` or full-width figure + `govuk-caption` |
| A result | the number itself IS the lead; table is evidence | `lead:` + small table |

The quadrant anti-pattern (four equal-weight blocks) is banned: it only appears
when the model can't decide what matters. Force a decision — that decision is the
lead.

## The encoding table — always reach for a diagram first

| The idea is… | Draw it as |
| --- | --- |
| a pipeline / data flow / algorithm | `gov-flow` — nodes + arrows (blue for the new component) |
| pairwise scores / alternatives × references | `gov-matrix` table, winning cell `.gov-matrix-win`, red for losers |
| "X beats Y" / complexity / before-after | `gov-contrast` with `gov-bignum` (green = better, red = worse) |
| an abstract flow too irregular to box | `mermaid` diagram |
| an existing figure/results screenshot | `govuk-image-right` + `govuk-caption` |
| a single headline statistic | the number IS the lead; no box, no table |

Labels inside nodes are data (entity names, symbols like ŷ, 0.7) — prose moves to
speaker notes or a single grey `govuk-caption` line.

## The removal law

Write the diagram first. Then delete: every word that labels nothing, every
box that repeats the lead, every legend the colours already say, and any slide
whose only job was to introduce the next one. If what's left isn't a slide to
show, it was a slide to say — notes carry it.

## Budgets (enforced by `scripts/lint-deck.py`)

| Element | Budget per slide | Rationale |
| --- | --- | --- |
| `govuk-lead` / frontmatter `lead:` / `govuk-takeaway` | **1 total** | competing focal points = none |
| `govuk-emph` / `govuk-emph-alt` spans | ≤ 2 | colour emphasis is a rationed resource |
| `govuk-panel` boxes | ≤ 2 | only findings (green) / caveats (red) |
| bullets | ≤ 5, ≤ ~12 words | bullets are prompts, prose lives in notes |
| speaker notes | mandatory on every slide except pure section dividers | the actual script |
| prose on a content slide | ≤ ~35 words **unless a diagram is present** | the message is drawn, not written |

## Layout anatomy & ordering

1. **Band** — the assertion title. Signed with kicker/number.
2. **Lead** — 1.6rem bold under the band: the takeaway of THIS slide, phrased as
   what the viewer should conclude, not what the slide contains.
3. **Body** — evidence, in an explicit pattern from the table above.
4. **Aside** (`#aside` slot or `govuk-caption`) — qualifications, baselines,
   provenance. Greyed, divided — never competing with the lead.
5. **Takeaway box** (optional, at the end) — the one line to carry into Q&A.

## Voice & typography

GOV.UK conventions: plain English, sentence case in body copy, numerals for
numbers. Deck-level deviation (structure only, inherited from the reference
decks): cover titles render Title Case; band titles may be Title Case for
consistency with the reference decks. Bold does the emphasising GOV.UK links do
on a web page; colour emphasis (`govuk-emph`) is rationed as above.

GDS Transport isn't redistributable; the sanctioned Helvetica/Arial fallback is
used. Headings 700, lead 1.6rem bold, body ~1.05rem with 1.5 line-height.

## Components and when to use them

| Component | Means |
| --- | --- |
| `govuk-inset-text` (+ `govuk-accent-*`) | tangential but useful — the aside of the aside |
| `govuk-panel` + `govuk-panel-title` | a labelled block: finding (green), caveat (red), definition (blue) |
| `govuk-tag` + `--yellow/--green/--red/--grey` | status, section number, version |
| `govuk-steps` | ordered pipeline — replaces prose "first… then…" |
| `govuk-takeaway` | the single line the slide exists to deliver |
| `govuk-table` | ruled numeric table, ≤4×4; anything larger is a figure |
| `govuk-caption` | figure/formula provenance |

## Common mistakes (each banned by the linter or doctrine)

- No `lead:` → viewer has no anchor (lint error)
- Four equal quadrants (lint didn't catch it but doctrine bans it) — decompose
  into lead + `govuk-steps` or lead + two-role columns
- Colour used decoratively instead of rationed emphasis (lint: >2 emph)
- `# heading` inside a govuk layout — duplicates the band (lint error)
- Callout boxes stacked to 3+ (lint error: >2 panels)
- Figures without caption or lead — unexplained evidence
