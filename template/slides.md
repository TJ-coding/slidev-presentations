---
# 👋 Slidev template deck — every slide demonstrates a pattern you can copy.
theme: seriph
# Theme options: https://sli.dev/custom/themes
title: 'Presentation Title'
info: |
  Short description of the deck. Appears in SPA meta tags.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
# Show line numbers in code blocks
lineNumbers: false
# Open in dev mode with a specific slide (e.g. ?page=5)
# site-wide footer (needs components/Footer.vue or the global-bottom layer)
defaults:
  layout: default
---

# Presentation Title ✨

A subtitle that explains the deck in one sentence

<div class="pt-10">
  <span class="px-2 py-1 rounded" style="background: rgba(255,255,255,0.08)">
    Author Name · March 2026
  </span>
</div>

<!--
Speaker notes: this HTML comment block becomes presenter notes.
Press `o` in dev for an overview of all slides.
-->

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/your-repo" target="_blank" class="text-xl slidev-icon-btn" alt="GitHub" title="Open repo">
    <carbon-logo-github />
  </a>
  <a href="https://sli.dev" target="_blank" class="text-xl slidev-icon-btn" alt="Docs" title="Slidev docs">
    <carbon:document />
  </a>
</div>

---
layout: two-cols
layoutClass: gap-8
---

# Agenda

<br>

<Toc title="" />

::right::

<div class="h-full flex flex-col justify-center">
  <p class="text-sm opacity-60 uppercase tracking-widest">Why this matters</p>
  <p class="text-2xl leading-relaxed">
    One-sentence thesis statement goes here. What should the audience <b>believe</b> or <b>do</b> after this talk?
  </p>
</div>

---
layout: section
---

# 01

## Problem / Context

---
layout: image-right
image: https://cover.sli.dev
---

# Layout: image-right

Bullet points on the left, image on the right.

- `layout: image-right` needs an `image:` frontmatter key
- Use `image-left` mirrored instead
- Swap sizes with `class:` in `<style>` or the `imageClass` in newer versions

<v-clicks>

- Anything wrapped in `<v-clicks>` reveals one item per click
- Use it for staged storytelling
- `<v-click>` works on single elements

</v-clicks>

---
layout: default
---

# Content slide: default layout

One heading, 3–5 bullets max. **Never walls of text.**

<br>

| Feature | Support |
| --- | :-: |
| Speaker notes | ✅ `<!-- comment -->` |
| Presenter view | ✅ `alt` + click preview |
| Record camera | ✅ built-in |

<style>
/* Scoped styles per slide are allowed and encouraged */
h1 { color: theme('colors.teal.400'); }
</style>

---
layout: quote
---

# "Short memorable quote."

Attribution / source

---
layout: center
class: text-center
---

# Centered layout

Use for punchlines, one-liners, and section pivots.

---
layout: two-cols
---

# Code slide

Left: explanation · Right: code (or swap)

::right::

```ts {2|3-5|all} twoslash
// Shiki + Twoslash: `|` pipes define click steps
const msg = 'highlight this first'
function demo() {
  return msg.toUpperCase()
}
```

<arrow v-click="[3,4]" x1="310" y1="290" x2="150" y2="240" width="3" color="#564ab1" />
<!-- Arrows: coordinates in px, v-click range ties reveal to code steps -->

---
layout: default
---

# Components & icons

Use [Iconify](https://icones.js.org) via `<carbon:name />`, `<mdi:name />`, `<logos:name />`…

<carbon:campsite class="text-teal-400 text-4xl inline-block" />

<Transform scale="0.9">
  <p>Wraps content — useful to shrink dense blocks</p>
</Transform>

<v-drag>Draggable element</v-drag>

<div grid="~ cols-2 gap-4" class="mt-8">
  <div class="rounded-lg bg-white/5 p-4"><b>Card pattern</b><br/>small caption text</div>
  <div class="rounded-lg bg-white/5 p-4"><b>Card pattern</b><br/>small caption text</div>
</div>

---
layout: end
---

# Thanks

Questions?

<div class="abs-br m-6 text-sm opacity-60">@yourhandle</div>
