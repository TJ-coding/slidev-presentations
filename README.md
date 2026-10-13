# slidev-presentations

GOV.UK design-style Slidev template + agent skill for making presentations.

```
skills/slidev-presentation/   Agent skill (Agent Skills spec) — self-contained
├── SKILL.md                 Routing + workflow instructions
├── template/                The Slidev deck template (copy, never edit in place)
│   ├── slides.md            Showcase deck — every slide demonstrates a pattern
│   ├── style.css            GOV.UK design tokens (palette, fonts, components)
│   ├── global-bottom.vue    Grey page number, bottom-right, on every content slide
│   ├── layouts/             Custom layouts: govuk-cover, govuk, govuk-two-cols,
│   │                        govuk-image-right, govuk-section, govuk-end
│   ├── components/          Drop-in Vue components for decks
│   ├── snippets/            Code snippets importable from slides.md
│   └── public/              Static assets (local images referenced as /img.png)
├── references/
│   ├── slidev-syntax.md     Syntax cheat sheet incl. govuk-* layouts
│   ├── design-guidelines.md GOV.UK palette, typography, voice, structure
│   └── diagrams.md          Contract for delegating figures to diagram sub-sessions
└── scripts/
    ├── new-deck.sh          Scaffold a new deck from template
    ├── serve.sh             Detached dev server (tmux)
    ├── export.sh            PDF / PPTX / PNG / SPA export
    ├── lint-deck.py         Enforces the design doctrine (quality gate)
    └── make-diagram.sh      Spawn a headless d3/tikz sub-session → public/diagrams/

examples/                    Worked decks produced with this skill
└── example-reproduction/    Reproduction of the reference deck

example-reference/           Sample deck of the user's usual presentations
```

Data figures (plots, precise schematics) are **not** drawn inside the skill: the
session spawns a focused headless pi sub-session driven by the skills in
`~/Projects/diagram-skills`, which writes the figure into the deck's
`public/diagrams/<slug>/`. See `skills/slidev-presentation/references/diagrams.md`
and the matching contract in `~/Projects/diagram-skills/docs/session-contract.md`.

## Branch policy

Two gated integration branches (see [MERGE-POLICY.md](MERGE-POLICY.md)):

- **`main`** — merges require a recorded **human** review (`Human-Review: approved …`).
- **`ai-main`** — merges require a recorded **AI** review (`AI-Review: approved …`).

No direct commits to either; work on feature branches and merge with `--no-ff`.
The `pre-merge-commit` hook (`.githooks/`, activated via `core.hooksPath`) blocks
under-gated merges on both branches.

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

## The GOV.UK style in one slide

- Black title band in `#0b0c0c` — set via `title:` frontmatter, rendered by the `govuk*` layouts
- Helvetica/Arial fallback for GDS Transport; plain, bold, austere
- Accents: blue `#1d70b8`, green `#00703c`, red `#d4351c`, yellow `#ffdd00`
- Components: `govuk-panel`, `govuk-inset-text`, `govuk-tag`, `govuk-table`, `govuk-emph`
- Diagram primitives (show, don't tell): `gov-flow` nodes+arrows, `gov-matrix`, `gov-contrast`/`gov-bignum`
- Page number bottom-right, grey
- **Doctrine enforced**: `scripts/lint-deck.py <deck>/slides.md` gates every deck — one lead per slide, budgets, and "no diagram ⇒ redraw"

## Installing the skill for pi

```bash
ln -s ~/Projects/slidev-presentations/skills/slidev-presentation \
      ~/.pi/agent/skills/slidev-presentation
```

Then in a session: ask for "a deck about X" or force it with `/skill:slidev-presentation`.
