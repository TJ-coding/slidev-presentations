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
lead: 'Score each sampled translation against gold references — pick the lowest-<span class="govuk-emph">risk</span> candidate.'
---

<div class="gov-flow">
  <span class="gov-node">
    <span class="gov-node-title">こんにちは</span>
    <span class="gov-node-sub">source x</span>
  </span>
  <span class="gov-arrow">→</span>
  <span class="gov-node gov-node--accent-blue">
    <span class="gov-node-title">Translation Model</span>
    <span class="gov-node-sub">samples ŷ₁..ŷ₃</span>
  </span>
  <span class="gov-arrow">→</span>
  <span class="gov-node"><span class="gov-node-title">Hello</span><span class="gov-node-sub">ŷ₁</span></span>
  <span class="gov-node"><span class="gov-node-title">Hi</span><span class="gov-node-sub">ŷ₂</span></span>
  <span class="gov-node"><span class="gov-node-title">Hey</span><span class="gov-node-sub">ŷ₃</span></span>
</div>

<table class="gov-matrix">
  <tbody>
  <tr>
    <th class="gov-matrix-corner"></th>
    <th>y₁</th><th>y₂</th><th>y₃</th><th>R(ŷ)</th>
  </tr>
  <tr>
    <th>ŷ₁</th><td class="gov-matrix-bad">1.5</td><td>1.5</td><td>1.3</td><td>1.43</td>
  </tr>
  <tr>
    <th>ŷ₂</th><td>1.9</td><td>2.2</td><td>2.4</td><td class="gov-matrix-win">2.17</td>
  </tr>
  <tr>
    <th>ŷ₃</th><td>1.2</td><td>1.4</td><td>1.5</td><td>1.37</td>
  </tr>
  </tbody>
</table>

<p class="govuk-caption" style="text-align:center;">
  utility u<sub>i,j</sub> = U(x, y<sub>i</sub>, ŷ<sub>j</sub>) · risk R(ŷ) = mean over gold · win = lowest risk
</p>

<!--
This slide replaces the two text slides from v1 ("MBR Decoding" + "Utility and
Risk"). Everything the audience must *see* is on screen: the pipeline, the score
matrix, the winning candidate (green). The formula only annotates the matrix.
Prose moved to notes: MBR scores every candidate against every gold reference
with a utility model; the candidate with the lowest expected loss wins.
-->

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
title: 'Text-based KGC: two pipelines'
lead: 'Same scoring idea, two encodings — pair encoding costs O(n²), entity encoding gives O(n).'
---

<div class="gov-flow" style="justify-content:center; gap:1.2rem;">

  <span class="gov-flow-item">
    <span class="gov-node">
      <span class="gov-node-title">MBR</span>
      <span class="gov-node-sub">cross-encoder</span>
    </span>
    <span class="gov-arrow">→</span>
    <span class="gov-node gov-node--accent-red">
      <span class="gov-node-title">O(n²)</span>
      <span class="gov-node-sub">score every pair</span>
    </span>
  </span>

  <span class="gov-flow-item">
    <span class="gov-node">
      <span class="gov-node-title">KGC</span>
      <span class="gov-node-sub">bi-encoder</span>
    </span>
    <span class="gov-arrow">→</span>
    <span class="gov-node gov-node--accent-green">
      <span class="gov-node-title">O(n)</span>
      <span class="gov-node-sub">encode once</span>
    </span>
  </span>

</div>

<p class="govuk-caption" style="text-align:center;">
  Pairwise scoring (BLEURT-style metric vs KG-BERT link prediction) becomes a dot product once entities are pre-encoded.
</p>

<!--
P12 original: two columns with bullet lists each ending in a verdict box.
Now: two pipeline endpoints with their complexity as the only text.
-->

---
layout: govuk
title: 'Architecture'
lead: 'One dot product per pair — no LLM call inside the score matrix.'
---

<div class="gov-flow">
  <span class="gov-node"><span class="gov-node-title">1</span><span class="gov-node-sub">input sequence</span></span>
  <span class="gov-arrow">→</span>
  <span class="gov-node"><span class="gov-node-title">2</span><span class="gov-node-sub">hypothesis encoding</span></span>
  <span class="gov-arrow">→</span>
  <span class="gov-node"><span class="gov-node-title">3</span><span class="gov-node-sub">pseudo-ref encoding</span></span>
  <span class="gov-arrow">→</span>
  <span class="gov-node"><span class="gov-node-title">4</span><span class="gov-node-sub">score matrix</span></span>
</div>

<div class="gov-contrast">
  <div class="gov-bignum gov-bignum--bad">
    <span class="gov-bignum-n">O(n²)</span>
    <span class="gov-bignum-label">cross-encoder pairs</span>
  </div>
  <div class="gov-bignum gov-bignum--good">
    <span class="gov-bignum-n">O(n)</span>
    <span class="gov-bignum-label">2 encodings per item</span>
  </div>
</div>

<p class="govuk-caption" style="text-align:center;">
  u<sub>i,j</sub> = ŷ<sub>i</sub> · y<sub>j</sub> — one dot product, no per-pair inference.
</p>

<!--
P18 original: numbered list + score matrix + complexity box.
Now: the pipeline itself is the numbered flow; the payoff is two numbers.
-->

---
layout: govuk
title: 'Conclusion and Future works'
lead: 'A linear-order utility for MBR; ablations and timing still open.'
---

<div class="gov-flow">
  <span class="gov-node">
    <span class="gov-node-title">Fix data</span>
    <span class="gov-node-sub">uniform distribution</span>
  </span>
  <span class="gov-arrow">→</span>
  <span class="gov-node">
    <span class="gov-node-title">Ablate</span>
    <span class="gov-node-sub">similarity fn · timing</span>
  </span>
  <span class="gov-arrow">→</span>
  <span class="gov-node gov-node--accent-green">
    <span class="gov-node-title">ARR</span>
    <span class="gov-node-sub">next submission</span>
  </span>
</div>

<!-- Mirrors p24. A closing list is fine here: a conclusion is inherently
     verbal — but every future-work could be its own evidence slide. -->

---
layout: govuk-end
title: 'Questions?'
kicker: 'github.com/your-repo'
author: 'Natural Language Processing Laboratory'
---

<!-- Invite questions by name where possible; speak to the complexity contrast. -->
