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

Three components of the reading order:

<ol class="govuk-steps">
  <li><strong>Band title</strong> — the assertion (≤ 12 words)</li>
  <li><strong>Lead</strong> — the takeaway of this slide, one sentence</li>
  <li><strong>Body</strong> — evidence in an explicit pattern</li>
</ol>

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
