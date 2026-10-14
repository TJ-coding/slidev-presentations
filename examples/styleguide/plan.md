# Deck plan: Presentation Guidelines

> The plan is the contract; `slides.md` implements it. Write this BEFORE any slide,
> get it approved, and keep it true — update the row first, then the slide.
> Method: `skills/slidev-presentation/references/planning.md`.

## Brief

- **Audience**: Anyone making decks from this template — human or agent.
- **Occasion / venue**: Developer reference ("devslide"), browsed visually.
- **Duration**: Reference, no runtime. Cover + 7 pairs.
- **After this talk the audience should believe / do**: Recognise each violation on
  sight and fix it — rules are user-mandated, shown as Don't/Do pairs, no prose.
- **Constraints**: User's principle set (v4): concise points; maximise lexical
  density; minimise elements on screen; maximise font size; visual hierarchy
  (size, colour, position); everything in logical order. Titles ≤3 words. No
  leads, no narration — pairs only.

## The story

The deck is the checklist, not an essay: six rules, six Don't/Do pairs, one cover.
Each pair renders the violation next to the fix using the theme's own components,
so the deck demonstrates what it demands.

Question ladder:

1. What does broken look like, and what does fixed look like? (six pairs)

## Slides

| # | layout | title (assertion, ≤12 words) | message — the one claim they take away | intention | evidence / visual | notes |
|---|--------|------------------------------|----------------------------------------|-----------|-------------------|-------|
| 1 | govuk-cover | Presentation Guidelines | The six rules follow. | open | bare cover | |
| 2 | dd | Concise points | One point per line, minimum words. | evidence | Don't: 24-word paragraph / Do: 3 short points | |
| 3 | dd | Dense words | Maximise lexical density. | evidence | Don't: 16 words, 5 meaningful / Do: 4 of 4 | |
| 4 | dd | Minimise elements | Minimise elements on screen. | evidence | Don't: 8 chips / Do: 1 number | |
| 5 | dd | Maximise Fonts-Size | Maximise font size. | evidence | Don't: 0.75rem paragraph / Do: GovStress box, header "Latency" + 410 → 40 ms | |
| 6 | dd | Visual hierarchy | Size, colour, position rank information. | evidence | Don't: identical quartet / Do: scaled, accented, placed top | |
| 7 | dd | Arrows and triangles | Block → navy ▼ → consequence. | evidence | Don't: → for consequence / Do: navy block "Installed Cache", navy ▼, "Drops Latency" | |
| 8 | dd | Ride the arrows | Values ride on top of / below the arrows; arrows pierce the component. | evidence | Don't: boxed I/O / Do: "こんにちは"/"Hello" values on top, "x₁ · hypothesis" etc. below | |

Intention vocabulary: open · signpost · introduce · mechanism · evidence ·
contrast · turn · caveat · verdict · ask.

## Figure requests (→ scripts/make-diagram.sh)

| slide | engine (d3/tikz) | slug | MESSAGE line for the brief |
|-------|------------------|------|----------------------------|
| — | — | — | None: pairs are built from the theme's own components. |
