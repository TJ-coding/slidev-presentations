---
# Presentation Guidelines. One rule per slide, demonstrated by a Don't/Do pair.
theme: default
colorSchema: light
title: 'Presentation Guidelines'
layout: govuk-cover
subtitle: ''
kicker: ''
meta: ''
author: ''
info: |
  Rules are shown, never described.
highlighter: shiki
drawings:
  persist: false
mdc: true
lineNumbers: false
---

<!--
Cover.
-->

---
layout: dd
bandColor: blue
title: 'Concise Points'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body">
      <p>We would like to take this opportunity to briefly walk you through the details of the implementation, step by step, before moving on.</p>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body">
      <ul style="margin: 0.2rem 0 0; padding-left: 1.1rem;">
        <li v-click><b>Model</b>: bi-encoder</li>
        <li v-click><b>Speed</b>: 10×</li>
        <li v-click><b>Cost</b>: flat</li>
      </ul>
    </div>
  </div>
</div>

<!--
24 words vs 9. One point per line.
-->

---
layout: dd
bandColor: blue
title: 'Dense Words'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body">
      <p class="mock-title">In order to achieve the reduction of latency, we made use of a caching mechanism.</p>
      <p class="dd-caption">16 words · 5 carry meaning</p>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body">
      <p class="mock-title">Caching cut latency 10×.</p>
      <p class="dd-caption">4 words · 4 carry meaning</p>
    </div>
  </div>
</div>

<!--
Lexical density: content words ÷ total words. Drive it to 1.
-->

---
layout: dd
bandColor: blue
title: 'Minimise Elements'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body">
      <div class="quad">
        <div class="quad-box">Model</div>
        <div class="quad-box">Data</div>
        <div class="quad-box">Cache</div>
        <div class="quad-box">Config</div>
        <div class="quad-box">Metrics</div>
        <div class="quad-box">Logs</div>
        <div class="quad-box">State</div>
        <div class="quad-box">Trial</div>
      </div>
      <p class="dd-caption">8 elements</p>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body">
      <GovStress label="After Cache">40 ms</GovStress>
      <p class="dd-caption">1 element</p>
    </div>
  </div>
</div>

<!--
If an element earns no glance, delete it.
-->

---
layout: dd
bandColor: blue
title: 'Maximise Fonts-Size'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body" style="display:flex; flex-direction:column; justify-content:center;">
      <p style="font-size: 0.75rem; line-height: 1.3; color: var(--steel);">Latency drops from 410 ms to 40 ms after the new cache.</p>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body" style="display:flex; flex-direction:column; justify-content:center;">
      <GovStress label="Latency">410 → 40 ms</GovStress>
    </div>
  </div>
</div>

<!--
Same message. The room reads only one of them.
-->

---
layout: dd
bandColor: blue
title: 'Visual hierarchy'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body">
      <div class="quad">
        <div class="quad-box">Report</div>
        <div class="quad-box">Report</div>
        <div class="quad-box">Report</div>
        <div class="quad-box">Report</div>
      </div>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body">
      <div style="text-align:center; margin-top: 0.2rem;">
        <span style="font-size: 3.6rem; font-weight: 800; color: var(--crimson);">Report</span>
      </div>
      <p class="govuk-caption" style="text-align:center; margin-top: 0.7rem;">size · colour · position</p>
    </div>
  </div>
</div>

<!-- Size, colour, position rank information. Use all three, together. -->

---
layout: dd
bandColor: blue
title: 'Arrows and triangles'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body">
      <p>Cache installed <span style="color: var(--crimson); font-weight: 700;">→</span> latency drops.</p>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body">
      <GovChain top-box="Installed Cache" bottom="Drops Latency" />
    </div>
  </div>
</div>

<!--
Block → arrow → consequence. The arrow points the conclusion down the page.
-->

---
layout: dd
bandColor: blue
title: 'Ride the arrows'
---

<div class="dd">
  <div class="dd-card dd-bad">
    <div class="dd-head">Don’t</div>
    <div class="dd-body">
      <div class="gov-flow">
        <span class="gov-node"><span class="gov-node-title">x₁</span><span class="gov-node-sub">hypothesis</span></span>
        <span class="gov-node"><span class="gov-node-title">x₂</span><span class="gov-node-sub">reference</span></span>
        <span class="gov-connector"></span>
        <span class="gov-node"><span class="gov-node-title">ŷ</span><span class="gov-node-sub">output</span></span>
      </div>
    </div>
  </div>
  <div class="dd-card dd-good">
    <div class="dd-head">Do</div>
    <div class="dd-body">
      <GovPipe
        :inputs="[
          { value: 'こんにちは', label: 'x₁ · hypothesis' },
          { value: 'Hello', label: 'x₂ · reference' },
        ]"
        :outputs="[
          { value: 'Hello', label: 'ŷ · output' }
        ]">
        <template #stage>
          <span class="gov-node gov-node--icon"><carbon:filter class="gov-node-icon" /><span class="gov-node-sub" style="color: var(--navy);">select min</span></span>
        </template>
      </GovPipe>
    </div>
  </div>
</div>

<!--
Example values ride on top of the arrows; their names sit below, in ink.
-->
