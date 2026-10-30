---
title: Home
nav_order: 0
---

# Quiet Slidev Kit

A GOV.UK-inspired [Slidev](https://sli.dev) deck kit: navy ink, crimson keyword,
Poppins, white ground. It ships a deck template, animated diagram components,
equation morphs, TikZ/D3 figures that follow the click clock, presenter sync, and
a quality gate. It is meant to be used as a **git submodule** of the repository
where your decks live.

## Start here

1. [Workflow & scripts](workflow.html): add the kit, scaffold a deck, lint, export.
2. [Layouts](layouts.html): cover, about-me, band slides, section dividers with a progress rail, end slide.
3. [Components](components.html): every prop and feature, with copy-paste examples.
4. [Animated figures](figures.html): TikZ insets and live D3 figures.
5. [Styling & CSS classes](styling.html): design tokens, utility classes, design rules.
6. [Presenting & sync](presenting.html): presenter, audience and multi-tab sync.

## Thirty-second tour

```bash
git submodule add https://github.com/TJ-coding/slidev-presentations kit
kit/skills/slidev-presentation/scripts/new-deck.sh "My Talk" my-talk
cd my-talk && npm run dev          # http://localhost:3030
```

```html
---
layout: govuk
title: 'Completing the square'
lead: 'Equations <strong>morph</strong>; nothing teleports.'
---

<GovDerivation :steps="[
  'ax^2 + bx + c = 0',
  { tex: 'x^2 + \\frac{b}{a}x = -\\frac{c}{a}', note: 'divide by $a$' },
]" />
```

The template's `slides.md` is a showcase: every slide demonstrates one pattern.
Read it next to these pages.
