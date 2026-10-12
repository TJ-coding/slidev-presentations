---
name: slidev-presentation
description: Create, edit, and export Slidev (Markdown-based) presentations using the template at ~/Projects/slidev-presentations/template. Use when the user asks to make, update, or polish slides, a deck, a talk, or a presentation (but NOT PowerPoint/.pptx files — use powerpoint-live-editing for those). Covers scaffolding new decks, Slidev syntax, layouts, speaker notes, and PDF/PPTX/PNG export.
---

# Slidev presentations

## When to use

- User asks for "slides", "a deck", "a talk", "a presentation" and the output can be web-based (default to Slidev).
- If they explicitly need PowerPoint editing live in Office → use `powerpoint-live-editing` skill instead. Slidev can still *export* to .pptx.

## Setup

Template lives at `~/Projects/slidev-presentations/template`. Helpers in `scripts/` (resolve relative to this skill's directory).

1. **Never edit the template in place for a new talk.** Copy it first:
   ```bash
   ./scripts/new-deck.sh "Talk Title" ~/Projects/my-talk
   ```
   This copies the template, rewrites the title, and runs `npm install` if needed.

2. **Dev loop**: run `./scripts/serve.sh <deck-dir>` — starts Slidev dev server (background, logs to `.slidev-dev.log`). The user can preview at http://localhost:3030. Edits to `slides.md` hot-reload instantly, so iterate by editing the file, not by restarting the server.

3. **Export**: run `./scripts/export.sh <deck-dir> pdf|pptx|png|spa`. PDF is the default deliverable. Exports land in the deck dir (e.g. `slides.pdf`).

## Editing the deck

All content lives in ONE file: `slides.md` (plus optional `components/`, `snippets/`, `style.css`). Before fancy syntax, check `references/slidev-syntax.md` for the exact patterns. Key points:

- Slides are separated by `---`; per-slide frontmatter comes after (`layout: two-cols` etc.). File-level frontmatter (theme, transition, defaults) is at the top before the first `---`.
- Speaker notes = HTML comments `<!-- ... -->` at the end of a slide.
- Progressive reveal = `<v-clicks>…</v-clicks>` wrapper or `<v-click>` on single elements.
- Icons are Iconify components: `<carbon:logo-github />`, `<mdi:alert />`. Never paste emoji as a substitute for icons in headings.
- Global footer + design tokens already exist (`global-bottom.vue`, `style.css`) — do not duplicate them per slide.

## Content rules (from references/design-guidelines.md — read it before writing a full deck)

- ≤ 5 bullets per slide, ≤ ~12 words per bullet.
- One idea per slide; split dense content across slides rather than shrinking text.
- Always write speaker notes: bullets are prompts, notes carry the full sentences.
- Cover → agenda (with `<Toc />`) → numbered sections (`layout: section`) → content → takeaways → `layout: end`.
- Prefer the template's layouts (`two-cols`, `image-right`, `quote`, `center`) over hand-rolled divs.

## Quality checklist before handing a deck back

1. `npm run build` (or export.sh) succeeds with no warnings about missing images/layouts.
2. Every image path exists (local files under `public/` or remote URLs).
3. Every slide has speaker notes (except trivial section dividers).
4. Slide count sane: ~1–2 min per slide → a 20 min talk ≈ 12–18 slides.
