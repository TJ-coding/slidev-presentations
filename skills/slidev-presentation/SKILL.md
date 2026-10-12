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

## Content rules (read references/design-guidelines.md before writing a full deck)

- ≤ 5 bullets per slide, ≤ ~12 words per bullet; one idea per slide.
- Titles are assertions, not topics.
- Always write speaker notes.
- Spine: cover → agenda → numbered `govuk-section` dividers → content → takeaways → `govuk-end`.
- GOV.UK voice: plain English, sentence-case titles, no decorative clutter.

## Quality checklist before handing a deck back

1. `./scripts/export.sh <deck-dir> pdf` succeeds with no missing-image warnings.
2. Every `image:` path exists (local files under `public/`).
3. Every content slide has speaker notes.
4. Slide count sane: ~1–2 min per slide.
