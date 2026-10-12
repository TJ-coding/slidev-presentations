# slidev-presentations

Reusable Slidev template + agent skill for making presentations.

## What's here

```
template/                  The Slidev deck template (copy, never edit in place)
├── slides.md              Showcase deck — every slide demonstrates a pattern
├── style.css              Global design tokens + tweaks (edit accent color here)
├── global-bottom.vue      Auto-footer on every slide
├── components/            Reusable Vue components (DeckFooter)
├── snippets/              Code snippets importable from slides.md
└── public/                Static assets (images referenced as /img.png)

skills/slidev-presentation/   Agent skill (Agent Skills spec)
├── SKILL.md                 Routing + workflow instructions
├── references/
│   ├── slidev-syntax.md     Full syntax cheat sheet
│   └── design-guidelines.md Deck structure & per-slide rules
└── scripts/
    ├── new-deck.sh          Scaffold a new deck from template
    ├── serve.sh             Detached dev server
    └── export.sh            PDF / PPTX / PNG / SPA export
```

## Quick start

```bash
# New deck
./skills/slidev-presentation/scripts/new-deck.sh "My Talk" ~/Projects/my-talk

# Iterate
cd ~/Projects/my-talk && npm run dev      # http://localhost:3030

# Ship
npm run export:pdf                        # → slides.pdf
npm run export:pptx                       # → slides.pptx
npm run build                             # → dist/ static site
```

## Installing the skill for pi

```bash
ln -s ~/Projects/slidev-presentations/skills/slidev-presentation \
      ~/.pi/agent/skills/slidev-presentation
```

Then in a session: ask for "a deck about X" or force it with `/skill:slidev-presentation`.

## Design tokens

Change the accent color / fonts once in `template/style.css` `:root` — every deck
copied from the template inherits it.
