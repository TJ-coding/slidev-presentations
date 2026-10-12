# Presentation design guidelines

## Structure (the "spine")

1. **Cover** — title, one-line subtitle, author/date. No bullets.
2. **Agenda** — use `<Toc />` (auto from headings) or 3–5 items max.
3. **Sections** — `layout: section` dividers with number + name (01, 02, …). Signposts keep audiences oriented.
4. **Content slides** — the meat.
5. **Takeaways** — 1 slide, ≤ 3 takeaways, restated plainly.
6. **End** — "Thanks / Questions?" + contact/handle.

## Per-slide rules

- **One idea per slide.** If you wrote "and" in the title, split it.
- **≤ 5 bullets, ≤ 12 words each.** Full sentences belong in speaker notes.
- **No paragraphs on slides.** If it reads like prose → notes or split.
- **Font floor**: nothing below ~18px at default zoom; captions ~14px.
- **Titles are assertions** when possible ("Caching cut latency 40%"), not topics ("Performance").
- Data → table only if ≤ 4 rows/columns; else chart image or diagram.
- Consistent icon set (stick to one Iconify collection, e.g. `carbon:`).

## Speaker notes

Every content slide gets notes in `<!-- -->`:
- The one sentence you would actually say.
- Any number/statistic that supports the bullets.
- Anticipated audience question, if any.

## Pacing

- 1–2 minutes per content slide. 20 min talk ≈ 12–18 slides total.
- Section dividers take 5 seconds — never put content on them.
- Use `<v-clicks>` when a list builds toward a punchline; not for every bullet by default (it slows down presenters).

## Visual consistency

- Use the template's layouts before inventing new structures.
- Design tokens (accent color etc.) live in `style.css` `:root` — change once.
- Reuse `deck-card` / `deck-caption` utility classes instead of inline styles.
- Images: local files go in `public/` and are referenced as `/img.png`. Prefer SVG/logos over screenshots of text.

## Common mistakes

- Wall-of-text slide (fix: notes + bullets)
- Five different accent colors (fix: tokens in style.css)
- Reading the slide verbatim (fix: notes carry the prose)
- Emojis as icons (fix: Iconify components)
- Forgetting the `image:` frontmatter on image layouts (Slidev renders an empty half)
