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
>
> **Maximum type.** Text is as large as possible *while preserving the visual
> hierarchy*. Hierarchy is carried by size, colour and position — so scale
> every element up until the ranking would break, then stop. If you must add
> text that can only be read at a small size, it doesn't belong on the slide:
> shorten it or move it to speaker notes. Tiny text is a design failure, not a
> detail.

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
| a **component** (model, metric, module) | an ICON: `gov-node--icon` + `carbon:*`/`ph:*` icon, caption under it — never a titled word-box |
| a **value** (input, output, candidate) | a bordered `gov-node` chip: value title + grey qualifier |
| a pipeline / data flow / algorithm | `gov-flow` — nodes + **wide connectors** (line + arrowhead that fills the gap); model-like stages are icon nodes (`gov-node--icon` + carbon/ph icon), values are bordered `gov-node` chips |
| an input/output between two nodes | `gov-io` — wide line + arrowhead, **value on top, semantic label under** |
| a step→step transition with no data | `gov-connector` plain wide line |
| pairwise scores / alternatives × references | `gov-matrix` table, winning cell `.gov-matrix-win`, red for losers |
| "X beats Y" / complexity / before-after | `gov-contrast` with `gov-bignum` (green = better, red = worse) |
| an abstract flow too irregular to box | `mermaid` diagram |
| an existing figure/results screenshot | `govuk-image-right` + `govuk-caption` |
| a single headline statistic | the number IS the lead; no box, no table |
| a bottom line / verdict ("Issue:", "Aim:") | `gov-stress` box + ▼ `gov-therefore` + consequence |
| arithmetic behind a claim (128 + 128 = 256) | `gov-eq` labelled equation row |

Labels inside nodes are data (entity names, symbols like ŷ, 0.7) — prose moves to
speaker notes or a single grey `govuk-caption` line. Components get shapes/icons;
values get boxes. Nothing on a diagram slide exists without a structural job.

## Connectors carry meaning — never mix them

The reference decks use three distinct connector types, each with a fixed job:

| Mark | Means | Form |
| --- | --- | --- |
| `→` | **input / output** — data flows through the pipeline | `gov-io` with the actual value on top of the arrow and the semantic name of the value under it (e.g. `0.7` / "utility score", `x = こんにちは` / "source sequence") |
| `▼` | **therefore / leads to** — logical consequence | `gov-therefore` — wide CSS triangle ≈2× height in width (not a glyph), colour-matched `gov-therefore--red/green`, + `gov-consequence` line |
| `+ = ×` | arithmetic relation | `gov-eq` row: operand values big, semantic labels above? **below**, in grey |

Arrows are reserved for data; using → for "therefore" is banned (that's ▼), and a
▼ never sits inside a data pipeline.

## The stress box — how bottom lines get said

The reference decks' verdicts are `gov-stress` boxes, drawn blocky: **4px
borders, weight-800 type**. A solid navy band carries `LABEL: value` (label
white, value in accent — Issue/red, Aim/green, Method/blue); a bold qualifier
line sits in the bordered body below; then a **wide CSS triangle** (`gov-therefore`,
~2× as wide as tall, colour-matched) down to the `gov-consequence` line. Use for
the 2–4 claims the talk exists to defend; the consequence colour alone carries
the verdict (dark = problem, red/green = direction of the fix).

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
