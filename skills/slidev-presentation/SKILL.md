---
name: slidev-presentation
description: Create, edit, and export Slidev (Markdown-based) presentations in GOV.UK design style using the template at ~/Projects/slidev-presentations/template. Use when the user asks to make, update, or polish slides, a deck, a talk, or a presentation (but NOT PowerPoint/.pptx files — use powerpoint-live-editing for those). Covers scaffolding new decks, the govuk-* layouts, Slidev syntax, and PDF/PPTX/PNG export.
---

# Slidev presentations (GOV.UK style)

## When to use

- User asks for "slides", "a deck", "a talk", "a presentation" and the output can be web-based (default to Slidev).
- If they explicitly need PowerPoint editing live in Office → use `powerpoint-live-editing` skill instead. Slidev can still *export* to .pptx.

## Setup

Template lives at `~/Projects/slidev-presentations/template`; reference sample decks in `~/Projects/slidev-presentations/example-reference/` (skim relevant pages to match the user's usual style). Helpers in `scripts/` (resolve relative to this skill's directory).

1. **Never edit the template in place for a new talk.** Copy it first:
   ```bash
   ./scripts/new-deck.sh "Talk Title" ~/Projects/my-talk
   ```

2. **Dev loop**: `./scripts/serve.sh <deck-dir>` — detached dev server at http://localhost:3030 (tmux). Edits to `slides.md` hot-reload; iterate by editing the file.

3. **Export**: `./scripts/export.sh <deck-dir> pdf|pptx|png|spa`. PDF is the default deliverable.

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
- **Show, don't tell.** If the idea has structure, DRAW it before writing about it: pipelines → `gov-flow` (wide connectors; components as icon nodes, values as chips), pairwise scores → `gov-matrix`, "X beats Y" / complexity → `gov-contrast`+`gov-bignum`, irregular flows → `mermaid`. Text only LABELS the diagram; prose goes to speaker notes. Then delete everything the diagram already says.
- **Reading order, always explicit.** Sequential content → `govuk-steps` or `gov-flow` (never symmetric quadrants). Comparison → `govuk-two-cols` only with distinct roles (left = the argument, right = the evidence). Everything else → single-column flow.
- **Connectors carry meaning — never mix them.** `→` is reserved for input/output and always takes the actual value on top and the semantic label under it (`gov-io`); `▼` means "therefore"; `+ = ×` are `gov-eq`. Never use an arrow for logical consequence.
- **Emphasis budget.** ≤2 `govuk-emph`/`govuk-emph-alt` spans per slide; ≤2 `govuk-panel` boxes; at most ONE anchor (`govuk-lead` or `govuk-takeaway`). Bottom-line verdicts belong in `gov-stress` boxes (label white + value accent on navy, qualifier below, ▼ to the consequence) — that's the "Issue:" / "Aim:" pattern from the reference decks.
- **Secondary material** goes in the `#aside` slot or a `govuk-caption` — never competition for the lead.
- Titles are assertions, ≤12 words; ≤5 bullets; every content slide ends with a `govuk-takeaway` box OR already is its own takeaway (green = finding, red = caveat).

## Quality gate (enforced, not advisory)

Before handing any deck back, run the linter and fix every finding:
```bash
./scripts/lint-deck.py <deck>/slides.md
```
It checks: layouts valid, `lead:` present on govuk slides, no `# heading` fighting the band, speaker notes everywhere, bullet/emph/panel budgets, single focal anchor. **Do not deliver a deck that fails lint.**

## Quality checklist before handing a deck back

1. lint passes: `./scripts/lint-deck.py <deck>/slides.md`
2. `./scripts/export.sh <deck-dir> pdf` succeeds with no missing-image warnings.
3. Every `image:` path exists (local files under `public/`).
4. Slide count sane: ~1–2 min per slide.
