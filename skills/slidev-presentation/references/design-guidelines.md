# Deck design — GOV.UK style outward, researcher-deck structure inward

The template adapts the [GOV.UK Design System](https://design-system.service.gov.uk/styles/)
(colour, typography, component patterns) to the structure of the user's existing
decks (see `example-reference/`): white body, full-width dark title band, accent
terms, page number bottom-right.

## Palette (tokens in template/style.css :root)

| Token | Value | GOV.UK role | Use in slides |
| --- | --- | --- | --- |
| `--govuk-text` | `#0b0c0c` | black | body text + band |
| `--govuk-secondary` | `#505a5f` | muted grey | captions, page numbers |
| `--govuk-link` | `#1d70b8` | link blue | links, bullet markers, inset borders |
| `--govuk-green` | `#00703c` | success | success panels, secondary terms |
| `--govuk-red` | `#d4351c` | error | warnings, emphasis terms |
| `--govuk-yellow` | `#ffdd00` | focus | section number tags |
| `--govuk-border` | `#b1b4b6` | 30% | table rules, figure frames |
| `--govuk-panel-grey` | `#f3f2f1` | panels | callout background |

Never hex-inline in slides; override the tokens instead.

## Typography

- GDS Transport itself is not redistributable; the stack
  `"Helvetica Neue", Helvetica, Arial` is its sanctioned fallback and looks the same.
- Headings bold (700), letter-spacing slightly tight; body 1.5 line-height.
- Web content is left-aligned by GOV.UK convention; the cover keeps centred
  text to match the user's existing decks.

## Layout anatomy

- `govuk-cover` — black band with yellow kicker tag, big title, blue meta line, grey author.
- `govuk` / `govuk-two-cols` / `govuk-image-right` — black title band (≈15% of height),
  white body with generous padding. Band title = frontmatter `title:`.
- `govuk-section` — full-bleed black (or dimmed photo via `image:`), yellow number tag.
- `govuk-end` — centred thanks + contact.
- Page number bottom-right in `--govuk-secondary`, automatically via `global-bottom.vue`.

## Voice

GOV.UK content rules: plain English, sentence case, active voice, no jargon without
expansion, numbers as numerals. Map to slides: assertion titles, ≤5 short bullets,
stats pulled into the band or a green panel.

## Components to copy from slides.md

| Class | When |
| --- | --- |
| `govuk-inset-text` (+ `govuk-accent-*`) | tangential fact, attribution |
| `govuk-panel` (+ `govuk-accent-green/red/blue`) + `govuk-panel-title` | key finding / caveat / method box |
| `govuk-tag` (+ `--yellow/--green/--red/--grey`) | statuses: BETA, NEW, section numbers |
| `govuk-emph` / `govuk-emph-alt` | coloured bold terms inline |
| `govuk-table` | ruled data table |
| `govuk-grid-2` | simple two-up card row |

## Common mistakes

- Writing `# Heading` inside govuk layouts (duplicates the band title)
- Emoji as icons / confetti decorations (GOV.UK is deliberately austere)
- More than one accent colour per slide
- Dense slides (fix: split + speaker notes)
- Section dividers with content (they're 5-second signposts)
