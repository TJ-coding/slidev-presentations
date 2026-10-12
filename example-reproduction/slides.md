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

**Minimum Bayes Risk decoding** as the umbrella for text-based Knowledge Graph
Completion.

<!--
P14-equivalent section divider. The original used a bull photo; pass
`image: /bull.jpg` for the photo variant. 5-second signpost, no content.
-->

---
layout: govuk
title: 'MBR Decoding: For Translation'
---

<div class="govuk-grid-2" style="font-size: 0.92em;">

<div>

### <span class="govuk-emph-alt">Sampling</span> translation candidates

Source Sequence　`x = こんにちは`

<div class="govuk-panel" style="padding:0.6rem 1rem;">
<b>Translation Model</b> → proposals: <span class="govuk-emph">Hello</span> · <span class="govuk-emph">Hi</span> · <span class="govuk-emph">Hey</span>
</div>

### <span class="govuk-emph-alt">Utility</span> Function

<div class="govuk-inset-text">
Measures translation quality: scores the predicted <span class="govuk-emph">ŷ</span>
against gold <span class="govuk-emph-alt">y</span> with an encoder-based metric model.
</div>

$$u_{i,j} = U(x,\; y_i,\; \hat{y}_j)$$

</div>

<div>

### Calculating <span class="govuk-emph">Risk</span>

$$R(\hat{y}_j) \propto \sum_i U(y_i, \hat{y}_j)$$

**Score Matrix**

<div style="border:2px solid #0b0c0c; display:inline-block;">
<table style="border-collapse:collapse; font-weight:700;">
<tr><td></td><td style="background:#fff"><span class="govuk-emph-alt">y₁</span></td><td style="background:#fff"><span class="govuk-emph-alt">y₂</span></td><td style="background:#fff"><span class="govuk-emph-alt">y₃</span></td></tr>
<tr><td><span class="govuk-emph">ŷ₁</span></td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₁,₁</td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₁,₂</td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₁,₃</td></tr>
<tr><td><span class="govuk-emph">ŷ₂</span></td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₂,₁</td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₂,₂</td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₂,₃</td></tr>
<tr><td><span class="govuk-emph">ŷ₃</span></td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₃,₁</td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₃,₂</td><td style=" border:1px solid #0b0c0c; padding:.45rem .9rem;">u₃,₃</td></tr>
</table>
</div>

</div>

</div>

<!--
Matches p5: left explains sampling + utility, right shows risk and the score matrix.
-->

---
layout: govuk-section
image: /bull.jpg
kicker: '02'
title: 'Method'
---

Bi-encoder based **utility** function with **Linear** scaling order.

<!--
P14: bull-photo divider. The dim overlay keeps title legible on any photo.
-->

---
layout: govuk-two-cols
title: 'Text-based Knowledge Graph Completion'
---

**MBR** → Utility Metric

- Source: こんにちは
- Reference <span class="govuk-emph-alt">y</span>, Hypothesis <span class="govuk-emph">ŷ</span>
- Output: similarity <span class="govuk-emph-alt">u</span>

<div class="govuk-panel govuk-accent-red">
  <p class="govuk-panel-title">Issue: O(n²)</p>
  Cross-encoders query every pair — extremely slow.
</div>

::right::

**KGC** → Link Prediction

- Head Entity <span class="govuk-emph-alt">Pluto</span>
- Relation Type <span class="govuk-emph-alt">Occasion</span>
- Tail: <span class="govuk-emph">Physicist</span> → score

<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">Linear: O(n)</p>
  Bi-encoder keeps entities pre-encoded — extremely fast.
</div>

<!--
Matches p12: two approaches side by side with the red/green verdict boxes.
-->

---
layout: govuk
title: 'Architecture'
---

<div class="govuk-grid-2" style="font-size: 0.95em;">

<div>

1. Construct Input Sequence
2. Make Hypothesis Encoding
3. Make Pseudo Reference Encoding
4. Construct Score Matrix

### <span class="govuk-emph">Utility</span>

$$u_{i,j} = \hat{y}_i \cdot y_j$$

</div>

<div>

### Score Matrix

| <span class="govuk-emph-alt">Pseudo Ref</span> | <span class="govuk-emph-alt">y₁</span> | <span class="govuk-emph-alt">y₂</span> | <span class="govuk-emph-alt">y₃</span> |
| --- | :-: | :-: | :-: |
| <span class="govuk-emph">ŷ₁</span> Hello | **ŷ₁**·y₁ | ŷ₁·y₂ | ŷ₁·y₃ |
| <span class="govuk-emph">ŷ₂</span> Hi | ŷ₂·y₁ | **ŷ₂**·y₂ | ŷ₂·y₃ |
| <span class="govuk-emph">ŷ₃</span> Hey | ŷ₃·y₁ | ŷ₃·y₂ | **ŷ₃**·y₃ |

<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">Number of LLM inference: O(n)</p>
</div>

</div>

</div>

<!--
Matches p18: numbered pipeline left, dot-product score matrix right.
-->

---
layout: govuk
title: 'Conclusion and Future works'
---

- Proposed a Utility Function for MBR with Linear Scaling Order
- Fix Training Data: Make Distribution Uniform
- Ablation Studies
  - Similarity Function: Cosine or Dot Product?
  - Measure Computational Time
- Aiming next ARR

<div class="govuk-inset-text">
  Comments welcome — especially on the ablation design.
</div>

<!--
Matches p24: bullets + one tangential note in computed inset style.
-->

---
layout: govuk-end
title: 'Questions?'
kicker: 'github.com/your-repo'
author: 'Natural Language Processing Laboratory'
---
