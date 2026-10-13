---
# Read this deck bottom-to-top as a pattern catalogue: band title -> lead -> steps -> panels -> aside -> end.
theme: default
colorSchema: light
title: 'Presentation Title, Using a Sentence If Possible'
layout: govuk-cover
subtitle: 'One-sentence outcome: what the audience will know or be able to do'
kicker: 'REGULAR MEETING'
meta: 'Group name · 17 June 2026'
author: 'Presenter Name · Laboratory'
info: |
  Canonical template deck. Every slide demonstrates one named pattern.
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: false
---

<!-- Cover mirror of the reference decks: band + Title Case + meta + authors. -->

---
layout: govuk-section
kicker: '01'
title: 'How to use this template'
---

Band → reading order → budgets → patterns → ship.

---
layout: govuk
title: 'The visual-hierarchy doctrine'
lead: 'Every slide gets <strong>one focal point</strong> — the lead — and everything else is arranged in roles around it.'
---

The reading order, itself shown in reading order:

<div class="gov-flow">
  <span class="gov-node">
    <span class="gov-node-title">Band</span>
    <span class="gov-node-sub">assertion ≤ 12 words</span>
  </span>
  <span class="gov-connector"></span>
  <span class="gov-node gov-node--accent-green">
    <span class="gov-node-title">Lead</span>
    <span class="gov-node-sub">takeaway, one sentence</span>
  </span>
  <span class="gov-connector"></span>
  <span class="gov-node gov-node--accent-blue">
    <span class="gov-node-title">Body</span>
    <span class="gov-node-sub">evidence pattern</span>
  </span>
</div>

<template #aside>
  Full doctrine: <code>references/design-guidelines.md</code>. Budgets enforced by
  <code>scripts/lint-deck.py</code>.
</template>

<!--
If you cannot write the lead in one sentence, the slide is really two slides.
-->

---
layout: govuk
title: 'Budgets, not vibes'
lead: 'Colour, boxes and bullets are rationed — the linter enforces the budget.'
---

| Element | Budget |
| --- | --- |
| `lead:` / `govuk-takeaway` | **1 per slide** |
| `govuk-emph` spans | ≤ 2 |
| `govuk-panel` boxes | ≤ 2 |
| bullets | ≤ 5 |
| speaker notes | every slide |

<ul class="govuk-steps">
  <li>Write the lead first</li>
  <li>Write the evidence second</li>
  <li>Only then decorate — green for findings, red for caveats</li>
</ul>

<!-- Lint before export: npm run lint (per-deck: scripts/lint-deck.py). -->

---
layout: govuk
title: 'Pattern: glossary of emphasis'
lead: 'Green-red panels signal finding-vs-caveat; tags carry status.'
---

<div class="govuk-grid-2">

<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">Success / key finding</p>
  <span class="govuk-emph-alt">O(n)</span> scaling holds in all ablations.
</div>

<div class="govuk-panel govuk-accent-red">
  <p class="govuk-panel-title">Caveat</p>
  <span class="govuk-emph">O(n²)</span> on the cross-encoder baseline.
</div>

</div>

Badges: <span class="govuk-tag govuk-tag--yellow">BETA</span>
<span class="govuk-tag govuk-tag--green">NEW</span>
<span class="govuk-tag govuk-tag--grey">DRAFT</span>

<!--
Max two panels. Anything else needs its own slide.
-->

---
layout: govuk-two-cols
title: 'Pattern: comparison'
lead: 'Left states the claim, right carries the evidence — never two identical blocks.'
---

**Claim** — the bi-encoder keeps entities pre-encoded.

One sentence of argument at most.

::right::

**Evidence** — the numbers.

<div class="govuk-panel govuk-accent-blue">
  <p class="govuk-panel-title">Result</p>
  Latency 410ms → 40ms at n=512.
</div>

<!--
Both halves labelled. Equal-weight quadrants are banned by doctrine.
-->

---
layout: govuk
title: 'Code and syntax'
lead: 'Left explanation, right code — pipe highlights define click steps.'
---

Left column text — use `govuk-two-cols` for this pattern.

<!-- Explain the snippet in notes; code on slide is signed, not prose. -->

```ts {2-3}
const msg = 'highlight these lines'
console.log(msg.toUpperCase())
```

Icons are Iconify: <carbon:checkmark class="govuk-check" /> — one collection per deck.

<style>
.govuk-check { color: #00703c; }
</style>

---
layout: govuk
title: 'Pattern: diagram'
lead: 'If the idea has structure, draw it — nodes and arrows beat bullets.'
---

<div class="gov-contrast">
  <div class="gov-bignum gov-bignum--bad">
    <span class="gov-bignum-n">O(n²)</span>
    <span class="gov-bignum-label">score every pair</span>
  </div>
  <div class="gov-bignum gov-bignum--good">
    <span class="gov-bignum-n">O(n)</span>
    <span class="gov-bignum-label">encode once</span>
  </div>
</div>

<table class="gov-matrix">
  <tbody>
  <tr><th class="gov-matrix-corner"></th><th>col A</th><th>col B</th><th>risk</th></tr>
  <tr><th>row 1</th><td>u₁,₁</td><td>u₁,₂</td><td>0.43</td></tr>
  <tr><th>row 2</th><td>u₂,₁</td><td class="gov-matrix-win">u₂,₂</td><td class="gov-matrix-win">0.17</td></tr>
  </tbody>
</table>

<p class="gov-legend">
  <span class="lg-red">hypothesis ŷ</span>
  <span class="lg-green">selected</span>
</p>

<!--
Diagram primitives: gov-flow (nodes + arrows), gov-node (--accent-*), gov-matrix
(--win/--bad cells), gov-contrast + gov-bignum, gov-legend. Anything that can
be drawn must be drawn: pipelines are gov-flow, pair scores are gov-matrix,
scale claims are gov-contrast bignums.
-->

---
layout: govuk
title: 'Pattern: verdict & triangle'
lead: 'Bottom lines get a thick stress box; a wide ▼ means therefore.'
---

<div class="gov-flow">
  <span class="gov-node"><span class="gov-node-title">x</span><span class="gov-node-sub">source</span></span>
  <span class="gov-io">
    <span class="gov-io-value">0.7</span>
    <span class="gov-io-line"></span>
    <span class="gov-io-label">utility score</span>
  </span>
  <span class="gov-node gov-node--icon gov-node--accent-green">
    <carbon:model class="gov-node-icon" />
    <span class="gov-node-sub">Utility Model</span>
  </span>
  <span class="gov-io gov-io--red">
    <span class="gov-io-value">risk</span>
    <span class="gov-io-line"></span>
    <span class="gov-io-label">select argmin</span>
  </span>
  <span class="gov-node"><span class="gov-node-title">ŷ</span><span class="gov-node-sub">hypothesis</span></span>
</div>

<div class="gov-stress">
  <div class="gov-stress-head"><span>Issue:</span> <span class="gov-stress-value--red">O(n²)</span></div>
  <div class="gov-stress-body">Quadratic Time Complexity</div>
</div>
<div class="gov-therefore gov-therefore--red">▼</div>
<div class="gov-consequence gov-consequence--dark">Extremely Slow</div>

<!--
Connector doctrine: → = data (value top / semantic label under), ▼ = therefore,
+ = × are gov-eq (see the KGC reproduction). Stress box: 4px borders, 800-weight
text, navy band "Label: value", qualifier line, wide ▼, consequence.
The wide triangle spans ~2× its height. Two boxes max per slide.
-->

---
layout: govuk-image-right
title: 'Pattern: figure slide'
image: https://cover.sli.dev
lead: 'A figure with a caption is evidence; the lead says what it shows.'
---

- `image:` frontmatter, or a `<template #caption>` slot below
- Figures follow the GOV.UK framed-box style

<!-- Say in notes what the figure proves and its source. -->

<template #caption>
  Fig. 1 — explain the figure in one sentence, in grey.
</template>

---
layout: govuk
title: 'Pattern: data slide'
lead: 'One number leads, the table supports it.'
---

<div class="govuk-takeaway govuk-accent-green">Latency drops from 410ms to 40ms at n=512.</div>

| n | MBR | Bi-encoder |
| --- | :-: | :-: |
| 8 | 34ms | 30ms |
| 512 | 410ms | **40ms** |

<!-- One number per data slide — the green box IS the takeaway. -->

---
layout: govuk-end
title: 'Questions?'
kicker: 'github.com/your-repo'
author: 'Laboratory · @yourhandle'
---

<!--
Canonical patterns complete. Deck passes lint-deck.py by construction.
-->
