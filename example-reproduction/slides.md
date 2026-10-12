---
# Reproduction of "Regular Meeting BULLS (1).pdf" with the GOV.UK template.
theme: default
colorSchema: light
title: 'Bi-encoder based utility function with linear scaling order'
layout: govuk-cover
subtitle: 'KGC as MBR?'
kicker: 'REGULAR MEETING'
meta: 'Natural Language Processing Laboratory · 17 June 2026'
author: 'D1: Tomoyuki Jinno, Line Yahoo: Koki Natsumi'
info: |
  Reproduction of an existing real deck to evaluate the GOV.UK template.
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: false
---

<!-- Cover mirrors p1: band + title + meeting/date + authors. -->

---
layout: govuk-section
kicker: '01'
title: 'Background'
---

---
layout: govuk
title: 'MBR Decoding: For Translation'
lead: 'Score every translation against gold references with a utility function, then pick the lowest-risk candidate.'
---

**How MBR selects a translation** — three steps:

<ol class="govuk-steps">
  <li><strong>Propose</strong> — the model samples candidates: <span class="govuk-emph">Hello</span>, <em>Hi</em>, <em>Hey</em></li>
  <li><strong>Score</strong> — utility model rates each against gold <span class="govuk-emph-alt">y</span></li>
  <li><strong>Select</strong> — the candidate with lowest expected risk wins</li>
</ol>

<template #aside>
  Utility replaces BLEU: it learns from human preference, so it tracks translation quality where n-gram overlap fails.
</template>

<!--
Was: four equal quadrants (sampling / utility / formula / matrix). Rebuilt with
lead + numbered steps; formula and score matrix live on slides 4 and 6 where they
are the point.
-->

---
layout: govuk
title: 'Utility and Risk'
lead: 'Risk is just the average utility over gold references — one formula drives the score matrix.'
---

<div class="govuk-grid-2">

<div>

**Utility** — quality of hypothesis ŷ against gold y:

$$u_{i,j} = U(x,\ y_i,\ \hat{y}_j)$$

**Risk** — expected loss of proposing <span class="govuk-emph">ŷ</span>:

$$R(\hat{y}_j) \propto \sum_i u_{i,j}$$

</div>

<div>

<div class="govuk-takeaway govuk-accent-green">Pick argmin of risk — the majority-safe candidate.</div>

| Pseudo Ref | y₁ | y₂ | y₃ |
| --- | :-: | :-: | :-: |
| ŷ₁ Hello | u₁,₁ | u₁,₂ | u₁,₃ |
| ŷ₂ Hi | u₂,₁ | u₂,₂ | u₂,₃ |
| ŷ₃ Hey | u₃,₁ | u₃,₂ | u₃,₃ |

<p class="govuk-caption">Score matrix over 3 hypotheses × 3 gold references.</p>

</div>

</div>

<!-- Mirrors p5's formula and score matrix, now with one focal line. -->

---
layout: govuk-section
image: /bull.jpg
kicker: '02'
title: 'Method'
---

Bi-encoder based **utility** function with **Linear** scaling order.

<!-- P14: bull-photo divider, dimmed overlay. 5-second signpost. -->

---
layout: govuk
title: 'Text-based Knowledge Graph Completion'
lead: 'Both MBR and KGC ask \"is this a good match?\" — cross-encoders cost O(n²), bi-encoders give O(n).'
---

Common shape of the two pipelines:

<ol class="govuk-steps">
  <li>Parse a pair — MBR: source + candidate · KGC: head entity + relation + tail</li>
  <li>Encode — cross-encoder scores the pair jointly — <span class="govuk-emph">O(n²)</span></li>
  <li><strong>Proposed</strong> — encode entities once, score by dot product — <span class="govuk-emph-alt">O(n)</span></li>
</ol>

<!--
P12 original: two columns each with its own red/green verdict box → four blocks.
Now: one lead, one 3-step comparison. If the audience needs the side-by-side
architecture, that's a follow-up slide with a figure.
-->

---
layout: govuk
title: 'Architecture'
lead: 'Four steps; one dot product per pair — no LLM call inside the score matrix.'
---

<div class="govuk-grid-2">

<div>

<ol class="govuk-steps">
  <li>Construct input sequence</li>
  <li>Make hypothesis encoding</li>
  <li>Make pseudo-reference encoding</li>
  <li>Construct score matrix</li>
</ol>

**Utility** — a dot product:

$$u_{i,j} = \hat{y}_i \cdot y_j$$

</div>

<div>

<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">Number of LLM inferences: O(n)</p>
  Two encodings per item, not per pair.
</div>

<p class="govuk-caption">Fig. 1 — score matrix, pseudo-reference × hypothesis.</p>

</div>

</div>

<!-- Mirrors p18: pipeline left, complexity box + caption right. -->

---
layout: govuk
title: 'Conclusion and Future works'
lead: 'A linear-order utility for MBR; ablations and timing still open.'
---

- Proposed a utility function for MBR with linear scaling order
- Fix training data (uniform), then retrain
- Ablation studies
  - Similarity function: cosine or dot product?
  - Measure computational time
- Aiming next ARR submission

<!-- Mirrors p24; sub-bullets are acceptable inside a ≤5 bullet cap. -->

---
layout: govuk-end
title: 'Questions?'
kicker: 'github.com/your-repo'
author: 'Natural Language Processing Laboratory'
---

<!-- Invite questions by name where possible; speak to the slide 4 complexity box. -->
