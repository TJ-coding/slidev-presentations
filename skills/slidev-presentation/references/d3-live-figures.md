# Live D3 figures on slides — click-driven animation

An animated D3 figure that plays ON the slide, stage by stage, driven by the
deck's own →/← keys — still authored and versioned in the figure's own source
directory (by reference, so edits propagate live), with a static PNG fallback
for print/PDF export.

Built and verified end-to-end in the acl26-talk deck (`MotivationFigure` /
`diagrams/motivation`). This doc is the procedure; the templates are:

| Artefact | Role |
|---|---|
| `template/components/D3Figure.vue` | the slide-side embedder (drop into any deck's `components/`) |
| `template/snippets/d3-figure-embedder.js` | the figure-side contract (copy the pattern into the figure's JS) |
| `scripts/drive-figure.mjs` | headless verification: press the keys, screenshot each state |

For STATIC figures (no animation) use `references/diagrams.md` instead — this
doc is only for figures whose stages should advance with the presenter.

## Architecture — three layers, by reference

```
<repo-root>/diagrams/<slug>/            the figure's own project, OUTSIDE the deck dir
  ├─ <slug>-figure.js                   classic script exposing window.<Name> = { mount }
  ├─ <slug>-figure.html                 standalone hero page (?static = settled frame)
  ├─ snap.mjs                           screenshots the settled frame → out/
  └─ out/                               PNG/SVG exports incl. the print fallback

<deck>/public/diagrams  →  ../../diagrams/<slug>      (symlink — never copy)
<deck>/components/D3Figure.vue                         (from the kit template)
<deck>/slides.md        —  <D3Figure …/> + `clicks: N` frontmatter
```

The symlink is the whole integration story: `public/**` is served verbatim by
the Slidev dev server, so the deck loads `/diagrams/<slug>-figure.js` straight
from the figure's source directory. Edit the figure → the slide hot-reloads.
Create it once:

```bash
ln -sfn ../../diagrams/<slug> <deck>/public/diagrams
```

(One live figure per deck is the common case; for several, use one symlink per
figure: `public/fig-<slug> → ../../diagrams/<slug>`.)

## The figure-side contract (embedder API)

The figure script is a **classic (non-module) script** loaded with a `<script>`
tag after d3 — no imports, no bundler. It exposes exactly one API:

```js
window.<Name> = { mount }        // mount(container, opts?) → controller
```

`mount` calls `draw(data, container, opts)` which builds the SVG and returns a
**controller**:

| member | meaning |
|---|---|
| `next()` | play the next stage forward; queue if one is playing; `false` when exhausted |
| `prev()` | play the current stage **backwards**; `false` at stage 1 or mid-flight |
| `jumpTo(n)` | render **exactly** stages 1..n instantly (resync primitive) |
| `stage()` | current stage number (1-based) |
| `cleanup()` | stop the ticker — the host unmounts |

`opts.steps` selects the driver: `'auto'` (the standalone hero page plays on
load), `'clicks'` (the slide drives everything), plus the `?static` URL flag /
`opts.static` for the settled frame.

Three laws make reverse playback and resync possible — **do not violate them**:

1. **Every stage event's `apply(e)` is a pure function of progress e ∈ [0,1]** —
   set opacities, positions, bar heights from `e`; nothing tweens on its own.
   The ticker drives `e` forward (0→1) or backward (1→0) through the same code.
2. **Stage 1 is the resting frame**, applied synchronously in clicks mode — a
   freshly mounted slide shows a complete figure with zero clicks.
3. **All timeline state is function-scoped** (`script`, `anims`, `animTimer`,
   `stage`) and hoisted ABOVE the controller closures — a `const` inside a
   setup branch makes every controller call throw `ReferenceError`.

Write the timeline as flat events, not nested callbacks:

```js
const script = [];                                   // { stage, delay, dur, ease, apply }
const animate = (stage, delay, dur, ease, apply) => script.push({ stage, delay, dur, ease, apply });

animate(1, 250, 700, d3.easeCubicOut, e => growBar(heroColumn, e));   // resting frame
animate(2, 2600, 620, d3.easeCubicOut, e => growBar(yearBar, e));     // stage 2 sweeps in
animate(3, 6300, 700, d3.easeCubicOut, e => growBar(futureBar, e));   // stage 3 grows
```

Copy `template/snippets/d3-figure-embedder.js` for the full skeleton — it has
the ticker, `playStage`, `playStageBackward` and the controller verbatim.

## The slide side

1. Copy `template/components/D3Figure.vue` into `<deck>/components/` (Slidev
   auto-imports it deck-wide by filename).
2. Reserve the clicks and mount the figure:

```md
---
layout: govuk
title: 'The slide assertion'
clicks: 2            ← stages − 1 (3-stage figure ⇒ 2 clicks before → leaves the slide)
---

<D3Figure
  script="/diagrams/motivation-figure.js"
  global="MotivationFigure"
  fallback="/diagrams/out/motivation-figure-static.png"
  alt="One time slice, the observed past, the dynamics run past the cutoff"
/>

<p class="govuk-caption" style="text-align:center;">
  ▶ press → to advance the stages · ← reverses
</p>
```

3. The component handles everything else: loading d3 + the figure script
   (cached per URL, shared across remounts), mounting with `steps: 'clicks'`,
   the `$clicks` watcher (forward / reverse / multi-jump fallback), and the
   print fallback.

### The `$clicks` wiring — why the fallbacks exist

```js
watch($clicks, (n, o) => {
  if (n > o) { controller.next();                                  // → one stage
    if (controller.stage() !== n + 1) controller.jumpTo(n + 1); }  // multi-jump
  else if (n < o) {
    const played = controller.prev();                              // ← reverse
    if (!played || controller.stage() !== n + 1) controller.jumpTo(n + 1); }
})
```

- **Multi-jump**: clicking the progress bar or an overview grid can move
  `$clicks` by more than 1; one `next()`/`prev()` covers one stage, so the
  watcher settles the figure instantly at the exact target (`jumpTo(n + 1)`).
- **Mid-flight**: pressing ← while a stage is still playing would have to
  reverse from a partial state. Instead the figure settles instantly
  (`prev()` returns false → `jumpTo` fallback). Reversing only ever starts
  from a settled stage.
- **Import**: `useSlideContext` comes from the `@slidev/client` ROOT. The
  `@slidev/client/context` subpath breaks vite pre-transform.

## Reverse navigation (←)

`playStageBackward(n)` animates each of stage n's events from progress 1 down
to 0 through its own easing, with the **stagger mirrored** — the element that
appeared last reverses first:

```js
const T = Math.max(...evs.map(e => e.delay + e.dur));   // stage's time span
for (const e of evs)
  anims.push({ t0: now + (T - e.delay - e.dur), dur: e.dur,
               ease: u => u,                            // driver linear;
               apply: u => e.apply(e.ease(1 - u)) });   // event ease inside
```

This is only possible because of law 1 (pure progress applies). If a stage's
`apply` uses time-based tweens (d3.transition on wall-clock), ← cannot reverse
it — keep applies pure.

## The jumpTo trap — render EXACTLY 1..n

```js
// ✗ WRONG — later-stage elements linger after back-navigation:
for (const e of script) if (e.stage <= n) e.apply(e.ease(1));
stage = Math.max(stage, n);

// ✓ RIGHT — stages > n reset to their START state:
for (const e of script) e.apply(e.stage <= n ? e.ease(1) : e.ease(0));
stage = n;
```

This bit the acl26 deck: ← appeared to "not work" because the amber future
bars and the 2044 card (stage 3) stayed on screen after snapping back to
stage 2. `jumpTo` must be an exact render, and `stage = n` (not `Math.max`).

## Print / PDF export fallback

Animation cannot survive `slidev export`. The slide swaps in a static PNG:

- the figure's `snap.mjs` (see `diagrams/motivation/snap.mjs`) screenshots the
  `?static` frame at 2× device scale into `out/<slug>-static.png`;
- `D3Figure.vue` hides the live SVG and shows the PNG under `@media print`.

**Regenerate the fallback after every figure edit** — the PNG is a snapshot,
not a live view. Add it to the figure-edit habit: edit → `node snap.mjs` →
check the slide.

## Verification loop (every figure change)

```bash
node <kit>/scripts/drive-figure.mjs http://localhost:3030/<slide> "R:4200,R:4200,L:4500,L:4200"
```

reads the screenshots in `/tmp/d3-drive/` (rest → forward → forward → reverse
→ reverse) **and the `pageerrors:` line** — the only error allowed is the
benign `Wake Lock permission request denied` headless noise. Then also check
the reversed states hard, not just "looks different": after ← the figure must
match the earlier stage EXACTLY (no lingering later-stage elements — see the
jumpTo trap).

## Pitfalls (each cost us a debugging round)

- `useSlideContext` from `@slidev/client` **root** — the `/context` subpath
  fails vite pre-transform.
- Controller closures must reach the timeline state: hoist `script`/`tickAll`/
  `playStage`/`playStageBackward` to function scope in the figure script.
- `d3.interval` tickers keep running after the slide unmounts — `cleanup()` on
  `onBeforeUnmount`, always.
- Drive stages ONLY via the `$clicks` watcher — don't mix in per-element
  `<v-click>`s on the same slide, the click budgets desync.
- `clicks: N` must equal stages − 1, or → leaves the slide mid-story / ← dies
  at stage 1 unexpectedly.
- Multi-instance decks: script loads are cached per URL at module level, so
  two `D3Figure`s with different `global` names coexist; two mounts of the
  SAME figure do not (the second mount draws a second SVG — give the figure's
  `draw` a guard if you ever need that).
