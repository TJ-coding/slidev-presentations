---
# The FIRST frontmatter block is BOTH file-level and the cover slide's.
theme: default
colorSchema: light
title: 'Presentation Title, Using a Sentence If Possible'
layout: govuk-cover
subtitle: 'One-sentence outcome: what the audience will know or be able to do'
kicker: 'MEETING | REGULAR'
meta: 'Group name · 17 June 2026'
author: 'Presenter Name · Laboratory / Department'
info: |
  Short deck description. Appears in SPA meta tags.
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: false
---

<!--
Speaker notes: this comment block becomes presenter notes.
Dev shortcuts: `o` overview, `d` dark mode, `f` fullscreen.
-->

---
layout: govuk
title: 'Agenda'
---

1. Context — why this matters
2. Method, in three numbered steps
3. Results and evidence
4. Takeaways and next steps

<!-- Lecture takes ~15 min: 1–2 min per content slide. -->

---
layout: govuk-section
kicker: '01'
title: 'Context'
---

Section dividers take 5 seconds — never put content on them.
Kicker renders as a yellow GOV.UK-style tag; add `image:` for a full-bleed photo.

---
layout: govuk
title: 'Context: the problem in one sentence'
---

- **Titles are assertions**, not topics ("Caching cut latency 40%" beats "Performance")
- ≤ 5 bullets, ≤ 12 words each — full sentences belong in these notes

<div class="govuk-inset-text">
  Inset text: blue left border for related-but-tangential facts.
</div>

<v-clicks>

- Wrap lists in `<v-clicks>` to build toward the punchline
- Don't default to click-reveals on every bullet

</v-clicks>

<!--
Notes carry the full sentence you would actually say.
The blue box is decorative; notes are where analysis lives.
-->

---
layout: govuk
title: 'Call-outs, tags and emphasis'
---

Patterns to copy:

<div class="govuk-grid-2">

<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">Success / key finding</p>
  Green left border (GOV.UK green #00703c).
</div>

<div class="govuk-panel govuk-accent-red">
  <p class="govuk-panel-title">Caveat / risk</p>
  Red left border for warnings (#d4351c).
</div>

</div>

- <span class="govuk-emph">Emphasis terms</span> use GOV.UK red, bold
- <span class="govuk-emph-alt">Secondary terms</span> use GOV.UK green, bold
- Badges: <span class="govuk-tag govuk-tag--yellow">BETA</span> <span class="govuk-tag govuk-tag--green">NEW</span> <span class="govuk-tag govuk-tag--grey">DRAFT</span>

---
layout: govuk-two-cols
title: 'Comparison: two columns'
---

Left column — e.g. the baseline method with its numbers.

::right::

Right column — e.g. the proposed method: paste method vs result.

<div class="govuk-panel govuk-accent-blue">
  <p class="govuk-panel-title">How to</p>
  Content before <code>::right::</code> lands left; content after lands right.
</div>

---
layout: govuk
title: 'Code and syntax'
---

Left: explanation · right: code — or use `govuk-two-cols` for this too.

```ts {2|3-5|all}
// `|` pipes define step-by-step highlighting
const msg = 'highlight this first'
function demo() {
  return msg.toUpperCase()
}
```

Icons come from Iconify: <carbon:checkmark class="govuk-check" /> — stick to one collection.

<style>
.govuk-check { color: #00703c; }
</style>

---
layout: govuk-image-right
title: 'Image slides'
image: https://cover.sli.dev
---

- Set `image:` in frontmatter (local files: put under `public/`, use `/img.png`)
- Image sits in a light-grey frame, like GOV.UK figure boxes
- Use `<slot name="right" />` for a caption row instead of an image

---
layout: govuk
title: 'Data slides'
---

| Service | Support |
| --- | :-: |
| Speaker notes | ✅ |
| Presenter view | ✅ |
| PDF / PPTX export | ✅ |

Use the `govuk-table` class for ruled GOV.UK tables; else this default is fine.

---
layout: govuk-section
kicker: '02'
title: 'Results'
---

---
layout: govuk
title: 'Takeaways'
---

<div class="govuk-panel govuk-accent-green">
  <p class="govuk-panel-title">The one thing to remember</p>
  Restate the thesis plainly, with the number that backs it up.
</div>

- ≤ 3 takeaways, restated plainly
- Aiming next: <span class="govuk-emph-alt">deadline / venue</span>

---
layout: govuk-end
title: 'Questions?'
kicker: 'Slides and code: github.com/your-repo'
author: '@yourhandle · Laboratory'
---

<!--
Export: npm run export:pdf → slides.pdf (also pptx, png, spa).
-->
