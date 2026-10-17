# slidev-presentations

The **Quiet** deck kit (GOV.UK-inspired: navy ink, crimson keyword, Poppins,
white ground) — agent skill + deck template + hooks + animatable components.
**Designed to be consumed as a git submodule** by the repository where decks
are actually built and versioned.

```
SKILL.md                    Routing + workflow instructions (Agent Skills spec)
template/                   The Slidev deck template (copy, never edit in place)
├── slides.md               Showcase deck — every slide demonstrates a pattern
├── plan.md                 Deck-plan skeleton (story + per-slide message/intention)
├── style.css               Theme tokens (palette, fonts, components, animations)
├── global-bottom.vue       Grey page number, bottom-right, on every content slide
├── layouts/                govuk-cover, govuk, govuk-two-cols, govuk-image-right,
│                           govuk-section, govuk-end + the dd pair layout
├── components/             Runnable pattern components (see below)
├── snippets/               Code snippets importable from slides.md
└── public/                 Static assets (local images referenced as /img.png)
references/                 planning, slidev-syntax, design-guidelines, diagrams
scripts/                    new-deck.sh, serve.sh, export.sh, lint-deck.py,
                            check-plan.py, make-diagram.sh
example-reference/          Sample reference deck (PDFs) used for the brand
.githooks/                  Merge-policy enforcement hooks ([](.githooks))
```

## Component kit (in `template/components/`)

| Component | Purpose |
|---|---|
| `GovArrow` | Data arrow: example value on top, name below, slides in on click |
| `GovBox` | Filled label block (navy fill / white text; `inverted` → white fill, ink text) |
| `GovTriangle` | The wide "therefore" ▼ — `color="green\|red"`, `dir="up\|left\|right"`, drops in on click |
| `GovChain` | Block → ▼ → consequence, single click; `:steps="[…]"` chains any number |
| `GovDerivation` | 3Blue1Brown-style equation morphs — `:steps="[…]"` LaTeX, tokens fly/fade per click |
| `GovPipe` | N inputs through an icon-name or box stage into M outputs |
| `GovStress` | The verdict box: infilled navy header + value frame |

All are animated at the component level (0.3s linear, disabled on print);
static exports always show the settled state.

## Using this repository as a submodule

Decks live in a **separate** repository (e.g. `slidev-decks`) and consume this
one, so the kit can be continuously improved without touching deck history:

```bash
cd ~/Projects/slidev-decks
git submodule add <URL-of-this-repo> kit     # pins a commit of the kit
git commit -m "chore: add slidev-presentations kit"
```

Then:

```bash
kit/scripts/new-deck.sh "My Talk" my-talk    # scaffold a new deck from kit/template
cd my-talk && npm install && npm run dev     # http://localhost:3030
node kit/scripts/lint-deck.py slides.md      # quality gate (or kit/scripts/check-plan.py .)
node kit/scripts/export.sh . pdf             # → slides.pdf
```

Update the kit independently; bump the pin whenever you want the improvements:

```bash
cd kit && git pull && cd ..
git add kit && git commit -m "chore: bump kit"
```

> Submodules added from a local file path need `git -c
> protocol.file.allow=always git submodule add …` (newer git blocks file
> transport by default). Swap the URL to the real remote with
> `git submodule set-url kit <URL>` once the kit is hosted.

Branches in the deck repository should follow the same human/AI gate policy as
this repo (see `MERGE-POLICY.md`).

## Branch policy

Two gated integration branches (see [MERGE-POLICY.md](MERGE-POLICY.md)):

- **`main`** — merges require a recorded **human** review (`Human-Review: approved …`).
- **`ai-main`** — merges require a recorded **AI** review (`AI-Review: approved …`).

No direct commits to either; work on feature branches and merge with `--no-ff`.
The `pre-merge-commit` hook (`.githooks/`, activated via `core.hooksPath`) blocks
under-gated merges on both branches.

## Installing the skill for pi

```bash
# direct clone
ln -s ~/Projects/slidev-presentations/skills/slidev-presentation \
      ~/.pi/agent/skills/slidev-presentation
# or, from a repository that submodules this kit:
ln -s ~/Projects/slidev-decks/kit/skills/slidev-presentation \
      ~/.pi/agent/skills/slidev-presentation
```

Then in a session: ask for "a deck about X" or force it with `/skill:slidev-presentation`.
