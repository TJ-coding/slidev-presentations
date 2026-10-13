---
name: slidev-presentation
description: Create, edit, and export Slidev (Markdown-based) presentations in GOV.UK design style. Use when the user asks to make, update, or polish slides, a deck, a talk, or a presentation (but NOT PowerPoint/.pptx files — use powerpoint-live-editing for those). Covers planning the story and per-slide message/intention BEFORE writing slides, scaffolding new decks, the govuk-* layouts, Slidev syntax, PDF/PPTX/PNG export, and delegating data figures to headless diagram sub-sessions (d3-diagrams / tikz-diagrams in ~/Projects/diagram-skills).
---

# Slidev presentations (GOV.UK style)

## When to use

- User asks for "slides", "a deck", "a talk", "a presentation" and the output can be web-based (default to Slidev).
- If they explicitly need PowerPoint editing live in Office → use `powerpoint-live-editing` skill instead. Slidev can still *export* to .pptx.

## Setup

This skill is self-contained. Template is `template/` inside this skill directory;
reference sample decks in `~/Projects/slidev-presentations/example-reference/` (skim
relevant pages to match the user's usual style). Helpers in `scripts/` (resolve
relative to this skill's directory).

1. **Never edit the template in place for a new talk.** Copy it first:
   ```bash
   ./scripts/new-deck.sh "Talk Title" ~/Projects/my-talk
   ```

2. **Dev loop**: `./scripts/serve.sh <deck-dir>` — detached dev server at http://localhost:3030 (tmux). Edits to `slides.md` hot-reload; iterate by editing the file.

3. **Export**: `./scripts/export.sh <deck-dir> pdf|pptx|png|spa`. PDF is the default deliverable.

## The story plan — mandatory, BEFORE any slide

**Never write or edit a slide before the plan exists and is approved.** The plan is
`<deck>/plan.md` (ships with every new deck from `template/plan.md`); the method is
`references/planning.md`. Read it before planning. In short:

1. **Brief first** — audience, duration (→ slide budget), and the exit sentence:
   *after this talk the audience should believe / do what?* If you can't write it,
   interview the user before anything else.
2. **The story** — one paragraph in claims (where it starts, the turn, where it
   lands) + a question ladder (the question each section answers in the audience's
   head).
3. **Slide contract** — one table row per slide: layout, title, **message** (the one
   claim they take away; usually becomes the slide's `lead:` verbatim) and
   **intention** (open · signpost · introduce · mechanism · evidence · contrast ·
   turn · caveat · verdict · ask). Reading the intention column top-to-bottom must
   *be* the story. Two adjacent slides with the same intention → one is redundant.
4. **Figures are planned, not improvised** — any row whose evidence is a real figure
   gets its make-diagram brief written in the plan's figure table; the slide's
   message is the figure brief's MESSAGE line, verbatim.
5. **Show the plan and wait for approval** before writing/editing `slides.md`. Then
   implement the table one slide at a time, in order.
6. **Plan stays true** — any slide change updates the plan row first, then the
   slide. Editing an existing deck without a plan: reconstruct `plan.md` first,
   confirm with the user, then edit.

## Editing the deck

All content lives in `slides.md` (+ `layouts/`, `components/`, `snippets/`). Check `references/slidev-syntax.md` for exact patterns. Key points:

- **Use the `govuk-*` layouts** (`govuk`, `govuk-cover`, `govuk-section`, `govuk-two-cols`, `govuk-image-right`, `govuk-end`). Titles go in per-slide frontmatter (`title: '…'`), NOT as `# heading` — the layout renders the black band. Add `kicker:` for the small eyebrow line, `bandColor: blue|green|red` to recolor, `image:` for `govuk-image-right`/`govuk-section`.
- First frontmatter block = file-level AND cover slide: keep exactly one `title` there.
- Speaker notes = HTML comments `<!-- ... -->`. Progressive reveal = `<v-clicks>`.
- GOV.UK components are CSS classes ready to copy from the showcase deck: `govuk-panel` (+ `govuk-accent-green/red/blue`), `govuk-inset-text`, `govuk-tag` (+ color modifiers), `govuk-emph`/`govuk-emph-alt` for coloured bold terms, `govuk-table`.
- Palette & fonts are tokens in `style.css` (`:root`) — change once, never inline hex.
- Icons are Iconify `<carbon:name />` etc. One collection per deck.

## Content rules — the visual-hierarchy doctrine

Read `references/design-guidelines.md` for the doctrine (it is the design contract of this framework). In short:

- **One focal point per slide.** Every content slide states its takeaway in the big `lead:` line right under the band. If you cannot write the takeaway as one sentence, the slide is really two slides.
- **Show, don't tell.** If the idea has structure, DRAW it before writing about it: pipelines → `gov-flow` (wide connectors; components as icon nodes, values as chips), pairwise scores → `gov-matrix`, "X beats Y" / complexity → `gov-contrast`+`gov-bignum`, irregular flows → `mermaid`. For real figures — data plots, precise schematics, anything mermaid can't draw well — spawn a **diagram sub-session** (see `references/diagrams.md`): `./scripts/make-diagram.sh <deck-dir> d3|tikz <slug> "message | notes"` builds it into `<deck>/public/diagrams/<slug>/` and you embed `/diagrams/<slug>/diagram.png`. Text only LABELS the diagram; prose goes to speaker notes. Then delete everything the diagram already says.
- **Reading order, always explicit.** Sequential content → `govuk-steps` or `gov-flow` (never symmetric quadrants). Comparison → `govuk-two-cols` only with distinct roles (left = the argument, right = the evidence). Everything else → single-column flow.
- **Connectors carry meaning — never mix them.** `→` is reserved for input/output and always takes the actual value on top and the semantic label under it (`gov-io`); `▼` means "therefore"; `+ = ×` are `gov-eq`. Never use an arrow for logical consequence.
- **Emphasis budget.** ≤2 `govuk-emph`/`govuk-emph-alt` spans per slide; ≤2 `govuk-panel` boxes; at most ONE anchor (`govuk-lead` or `govuk-takeaway`). Bottom-line verdicts belong in `gov-stress` boxes (label white + value accent on navy, qualifier below, ▼ to the consequence) — that's the "Issue:" / "Aim:" pattern from the reference decks.
- **Secondary material** goes in the `#aside` slot or a `govuk-caption` — never competition for the lead.
- Titles are assertions, ≤12 words; ≤5 bullets; every content slide ends with a `govuk-takeaway` box OR already is its own takeaway (green = finding, red = caveat).

## Quality gate (enforced, not advisory)

Before handing any deck back, run BOTH and fix every finding:
```bash
./scripts/lint-deck.py <deck>/slides.md
./scripts/check-plan.py <deck>
```
lint checks: layouts valid, `lead:` present on govuk slides, no `# heading` fighting the band, speaker notes everywhere, bullet/emph/panel budgets, single focal anchor. check-plan checks: plan.md exists, every slide has a planned row (title match), count agrees. **Do not deliver a deck that fails either.**

## Quality checklist before handing a deck back

1. lint passes: `./scripts/lint-deck.py <deck>/slides.md`
2. plan passes: `./scripts/check-plan.py <deck>` — story + per-slide message/intention
   in `plan.md` were approved before the slides were written, and the two stay in sync.
3. `./scripts/export.sh <deck-dir> pdf` succeeds with no missing-image warnings.
4. Every `image:` path exists (local files under `public/`). Every delegated figure
   exists at `/diagrams/<slug>/diagram.png` and was produced by a diagram sub-session
   (`references/diagrams.md`), never hand-edited SVG.
5. Slide count sane: ~1–2 min per slide.
