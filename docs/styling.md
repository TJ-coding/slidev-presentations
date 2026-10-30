---
title: Styling & CSS classes
nav_order: 6
---

# Styling and CSS classes

Everything lives in `template/style.css`: design tokens, a type scale, and the
utility classes you write directly in `slides.md`. Classes that only a
component renders (GovChain, GovDerivation, GovWindow, ...) are documented on
their own pages (`gov-derivation.md`, `gov-chain.md`, and so on).

## Design tokens

Custom properties on `:root`.

| Token | Value | Use |
| --- | --- | --- |
| `--navy` | `#0d2641` | ink, bands, nodes |
| `--crimson` | `#d71c56` | THE keyword; "bad" / issue |
| `--sage` | `#5e9e8f` | secondary accent, links, "good" / aim |
| `--steel` | `#7e96ab` | meta text, captions, page number |
| `--line` | `#d9e2ea` | hairlines |
| `--soft` | `#f4f7fa` | panel / takeaway fill |
| `--paper` | `#ffffff` | slide ground |
| `--govuk-text` | `var(--navy)` | legacy alias |
| `--govuk-secondary` | `var(--steel)` | legacy alias |
| `--govuk-link` | `var(--sage)` | legacy alias |
| `--govuk-green` | `var(--sage)` | legacy alias |
| `--govuk-red` | `var(--crimson)` | legacy alias |
| `--govuk-yellow` | `var(--navy)` | legacy alias (no yellow in this theme) |
| `--govuk-border` | `var(--line)` | legacy alias |
| `--govuk-panel-grey` | `var(--soft)` | legacy alias |
| `--deck-accent` | `var(--crimson)` | deck-level accent |
| `--deck-accent-alt` | `var(--sage)` | deck-level secondary accent |
| `--deck-band` | `var(--navy)` | default band colour; override per deck |
| `--govuk-font` | `"Poppins", "Helvetica Neue", Helvetica, Arial, sans-serif` | all text |
| `--radius` | `10px` | rounded corners (used by GovWindow) |

Poppins (400/600/700/800) is loaded from Google Fonts; the stack falls back to
Helvetica/Arial offline. Dark mode is neutralised: the ground stays white and
ink stays navy.

Override a token for one deck by redefining it in the deck's own `style.css`
(for example `:root { --deck-band: #1f4d3a; }`).

### Type scale

| Element | Size / weight |
| --- | --- |
| slide body, `p`, `ul`, `ol`, `li` | 1.15rem, line-height 1.6 |
| `h1`-`h4` | weight 700, letter-spacing -0.01em |
| band title (`.gov-band-title`) | 2.6rem / 700 (the later global rule in `style.css`; `govuk.vue` declares 1.9rem earlier in the cascade) |
| band kicker | 0.75rem uppercase, 0.12em tracking |
| `govuk-lead` | 1.6rem / 700, max 62ch |
| `govuk-takeaway` | 1.25rem / 700 |
| `govuk-aside` | 1rem, steel |
| `govuk-caption` | 0.9rem, steel |
| `gov-settings` | 0.62rem, steel |

## Hierarchy primitives

### Lead

Normally set via frontmatter `lead:`. As a class (for layouts that have no
`lead` key, such as `govuk-image-right`):

```html
<h2 class="govuk-lead">Utility replaces hand-tuned metrics, but you pay for <strong>every pair</strong>.</h2>
```

`<strong>` inside a lead is crimson; `<code>` gets a soft background.

### Takeaway

The single line a slide exists to deliver. Accent: `govuk-accent-green`
(default), `govuk-accent-red`, `govuk-accent-blue` (left edge colour).

```html
<div class="govuk-takeaway govuk-accent-green">Latency drops from 410ms to 40ms at n=512.</div>
```

### Steps, caption, aside

```html
<ol class="govuk-steps">
  <li>Encode hypotheses</li>
  <li>Encode pseudo-references</li>
  <li>Score matrix</li>
</ol>

<p class="govuk-caption">Fig. 1: validation loss by year. Source: Table 3.</p>

<div class="govuk-aside">Greyed secondary material with a hairline above.</div>
```

`govuk-aside` is what the `#aside` slot of `govuk` renders; write it by hand
only on other layouts.

## Panels, insets, tags

```html
<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">Finding</p>
  <p>Hankel DMD tracks the shift.</p>
</div>

<div class="govuk-panel govuk-accent-red">
  <p class="govuk-panel-title">Caveat</p>
  <p>Only 12 time slices.</p>
</div>

<div class="govuk-inset-text">Tangential but useful: the aside of the aside.</div>

<span class="govuk-tag">Section 2</span>
<span class="govuk-tag govuk-tag--green">Done</span>
<span class="govuk-tag govuk-tag--red">Blocked</span>
<span class="govuk-tag govuk-tag--grey">v0.2</span>
```

Panel accents: `govuk-accent-red`, `govuk-accent-green`, `govuk-accent-blue`
(default navy edge). Tag variants: `--green`, `--red`, `--grey`. There is no
`--yellow` variant in the CSS, although `design-guidelines.md` mentions one.

## Layout helpers

```html
<div class="govuk-grid-2">
  <div>left</div>
  <div>right</div>
</div>

<table class="govuk-table">
  <tr><th>n</th><th>MBR</th></tr>
  <tr><td>8</td><td>34ms</td></tr>
</table>
```

`govuk-grid-2` is a plain two-column grid with 1.5rem gap (inside a `govuk`
slide; use `govuk-two-cols` when the columns have argument/evidence roles).
`govuk-table` is a ruled table with a navy header rule; keep it to 4x4 or
smaller. `govuk-page-number` colours a hand-placed page number.

## Emphasis spans

```html
<span class="govuk-emph">the keyword</span>        <!-- crimson, bold -->
<span class="govuk-emph-alt">the counter-term</span> <!-- sage, bold -->
```

Rationed: at most two per slide, counting both classes. Other span classes:

- `accent-amber`: amber bold. Only styled inside the `govuk-about` layout
  (scoped CSS in that layout); outside it the class has no effect.
- `w-red`, `w-green`, `w-blue`, `w-amber`: coloured bold words, for the
  **Don't** side of a `dd` pair only (they demonstrate colour abuse).

## Diagram primitives

Components (`GovChain`, `GovBox`, `GovStress`, `GovPipe`, `GovArrow`,
`GovTriangle`, `GovWindow`) wrap the heavier versions of these; the raw
classes below are for hand-written diagrams.

### Flow: nodes and connectors

```html
<div class="gov-flow">
  <span class="gov-node">
    <span class="gov-node-title">こんにちは</span>
    <span class="gov-node-sub">source x</span>
  </span>
  <span class="gov-io">
    <span class="gov-io-value">samples 3</span>
    <span class="gov-io-line"></span>
    <span class="gov-io-label">input sequence</span>
  </span>
  <span class="gov-node gov-node--icon gov-node--accent-green">
    <carbon:machine-learning class="gov-node-icon" />
    <span class="gov-node-sub">Translation Model</span>
  </span>
  <span class="gov-connector"></span>
  <span class="gov-node gov-node--accent-red">
    <span class="gov-node-title">Hello</span>
  </span>
</div>
```

| Class | Meaning |
| --- | --- |
| `gov-flow` | horizontal row, centred, no wrap |
| `gov-node` | filled navy chip. Variants `gov-node--accent-green` / `--accent-red` / `--accent-blue` |
| `gov-node-title`, `gov-node-sub` | bold value / small qualifier inside a node |
| `gov-node--icon` | icon-only node (a component); put a `carbon:*` / `ph:*` icon with class `gov-node-icon` inside, caption in `gov-node-sub` |
| `gov-io` | `→` data arrow. Children in order: `gov-io-value` (value on top), `gov-io-line`, `gov-io-label` (semantic name below). Variants `gov-io--green`, `gov-io--red` |
| `gov-connector` | plain wide arrow for a step-to-step transition with no data |

### Therefore, consequence, equation

```html
<div class="gov-therefore gov-therefore--red"></div>
<p class="gov-consequence gov-consequence--red">A is infeasible</p>

<div class="gov-eq">
  <span class="gov-eq-item"><span class="gov-eq-value">128</span><span class="gov-eq-label">hypotheses</span></span>
  <span class="gov-eq-op">+</span>
  <span class="gov-eq-item"><span class="gov-eq-value">128</span><span class="gov-eq-label">references</span></span>
  <span class="gov-eq-op">=</span>
  <span class="gov-eq-item"><span class="gov-eq-value gov-eq-value--green">256</span><span class="gov-eq-label">encodings</span></span>
</div>
```

| Class | Meaning |
| --- | --- |
| `gov-therefore` | a wide CSS triangle (a logical "therefore", never a glyph). Colour `--red` / `--green`; direction `--up` / `--left` / `--right`, default down |
| `gov-consequence` | bold centred line under the triangle. Colour `--red`, `--green`, `--dark` |
| `gov-eq`, `gov-eq-item`, `gov-eq-value`, `gov-eq-label`, `gov-eq-op` | labelled arithmetic row. Value colour `gov-eq-value--red/--green/--dark` |

### Stress box

Hand-written bottom-line box: a navy head with `LABEL: value`, bordered body
below. For most uses prefer the `GovStress` component (see its page).

| Class | Meaning |
| --- | --- |
| `gov-stress` | wrapper |
| `gov-stress-head`, `gov-stress-body` | head band and bordered body (7px border) |
| `gov-stress--solo` | no head, body closes its own top border and uses 1.6rem type |
| `gov-stress--inverted` | navy body with white text, white head |
| `gov-stress-value--red/--green/--blue` | muted value colours that read on navy |

### Contrast, big numbers, matrix

```html
<div class="gov-contrast">
  <div class="gov-bignum gov-bignum--bad">
    <span class="gov-bignum-n">O(n²)</span>
    <span class="gov-bignum-label">MBR</span>
  </div>
  <div class="gov-bignum gov-bignum--good">
    <span class="gov-bignum-n">O(n)</span>
    <span class="gov-bignum-label">bi-encoder</span>
  </div>
</div>

<table class="gov-matrix">
  <tr><th class="gov-matrix-corner"></th><th>ref 1</th><th>ref 2</th></tr>
  <tr><th>hyp A</th><td>0.7</td><td class="gov-matrix-win">0.9</td></tr>
  <tr><th>hyp B</th><td class="gov-matrix-bad">0.2</td><td>0.5</td></tr>
</table>
<div class="gov-legend"><span class="lg-green">best</span><span class="lg-red">worst</span></div>
```

| Class | Meaning |
| --- | --- |
| `gov-contrast` | two-column grid for before/after comparisons |
| `gov-bignum` (+ `-n`, `-label`) | boxed statistic; `--good` (sage) / `--bad` (crimson) |
| `gov-matrix` | score matrix table. Cell classes `gov-matrix-win` (sage outline), `gov-matrix-bad` (crimson text); `gov-matrix-corner` on the empty corner cell |
| `gov-legend` | row of swatch labels; children `lg-red`, `lg-green` |

## Settings footer

One line of run configuration pinned to the slide foot, left of the page
number (0.62rem, steel, single line with ellipsis).

```html
<p class="gov-settings">m = 5, r = 5 · cutoff 1950 · seed 0</p>
```

## TikZ inset

Wrap a `<TikzSync>` in `tikz-inset`; set the width per slide with
`--tikz-width` (default `46rem`). The row collapses with an animation once
`hide-at` fires, so a `GovDerivation` below glides up.

```html
<div class="tikz-inset" style="--tikz-width: 34rem">
  <TikzSync name="example-chain" :at="[0, 1.2, 2.4]" />
</div>
```

## Design rules

The doctrine behind these classes (full text:
`references/design-guidelines.md`).

**Two laws.** One focal point per slide (the lead; everything else is arranged
in roles around it). Show, don't tell: if the idea has structure, draw it, and
text exists only to label a diagram. Text is as large as possible while the
hierarchy still ranks; text that is only readable small goes to speaker notes.

**Reading order.** Band (assertion, signed with a kicker) then lead (what to
conclude, not what the slide contains) then body (evidence in an explicit
pattern) then aside (qualifications, provenance) and optionally one takeaway
box. Four equal quadrants are banned.

**Budgets.** Enforced by `scripts/lint-deck.py <deck>/slides.md`:

| Element | Budget per slide |
| --- | --- |
| `lead:` / `govuk-lead` / `govuk-takeaway` | **1 in total** |
| `govuk-emph` / `govuk-emph-alt` spans | at most 2 |
| `govuk-panel` boxes | at most 2 |
| bullets | at most 5, about 12 words each |
| speaker notes (`<!-- -->`) | every slide except section dividers |
| prose on a content slide | about 35 words, unless a diagram is present |

Other lint errors: no `layout:`, unknown layout, missing `title`, `govuk`
without `lead`, and a markdown `# heading` inside a content layout. A "visual"
is detected by `gov-flow`, `gov-node`, `gov-matrix`, `gov-contrast`,
`gov-bignum`, `gov-window`, `mermaid`, `image:`, `<img`, `GovDerivation`,
`GovWindow`, `TikzSync` or `D3Figure`.

**Connector semantics. Never mix them.**

| Mark | Means | Class |
| --- | --- | --- |
| `→` | input / output: data flows through the pipeline | `gov-io`, value on top, semantic name under |
| `▼` | therefore / leads to: logical consequence | `gov-therefore` (+ `gov-consequence`) |
| `+ = ×` | arithmetic relation | `gov-eq` row, labels below in grey |
| plain wide line | step-to-step with no data | `gov-connector` |

Arrows are reserved for data; using `→` for "therefore" is banned, and a `▼`
never sits inside a data pipeline.

**Encoding.** Components (model, metric, module) are icons
(`gov-node--icon`); values are `gov-node` chips; pipelines are `gov-flow`;
pairwise scores are `gov-matrix`; "X beats Y" is `gov-contrast` with
`gov-bignum`; a verdict is a `gov-stress` box then `▼` then a consequence line.
Node labels are data, never prose.

**Voice.** Plain English, sentence case in body copy, numerals for numbers.
Cover and band titles may be Title Case. Colour emphasis is rationed.

**Removal law.** Draw the diagram first, then delete every word that labels
nothing, every box that repeats the lead, and every slide whose only job is to
introduce the next one.
