---
title: Animated figures
nav_order: 5
---
{% raw %}

# Animated figures

The kit has two ways to put an animated figure on a slide, plus a pattern for
writing your own. All of them follow the slide's click counter (`$clicks`) rather
than registering clicks of their own.

| Need | Use | Source of the animation |
|---|---|---|
| A schematic that builds up beside a derivation, typeset in TikZ | [`TikzSync`](#tikzsync) | SMIL `<animate>` timelines compiled from TikZ |
| A data figure with stages that play forward and backward | [`D3Figure`](#d3figure) | a classic D3 script that follows the embedder contract |
| A one-off animated SVG/Vue figure | [Custom click-driven figures](#custom-click-driven-figures) | your own Vue SFC |
| A static plot or schematic | [Static figures](#static-figures-and-sub-session-delegation) | a headless sub-session renders an image |

Paths below are relative to `skills/slidev-presentation/` in the kit. A deck
scaffolded with `new-deck.sh` has its own copy of `template/`, so inside a deck
read `components/`, `tikz/`, `scripts/` and `snippets/` directly.

---

## TikzSync

`components/TikzSync.vue` inlines an SVG that was compiled at build time from a
TikZ source and drives that SVG's own SMIL clock from the slide's click count.
It registers no `v-click` elements, so it adds nothing to the slide's click
budget. Pair it with a `GovDerivation` (which does register one click per morph)
or with `v-click`s and it stays in lockstep.

Live: the template's `example-chain` inset, driven by the derivation's clicks.

<!-- demo: figures-tikzsync-live -->
```html
<div class="tikz-inset" style="--tikz-width: 34rem">
  <TikzSync name="example-chain" :at="[0, 1.2, 2.4]" />
</div>
<GovDerivation
  :steps="[
    { tex: '\\mathbf{x}_0', section: 'Evolution' },
    { tex: '\\mathbf{x}_1 = \\mathbf{A}\\mathbf{x}_0' },
    { tex: '\\mathbf{x}_2 = \\mathbf{A}\\mathbf{x}_1 = \\mathbf{A}^2\\mathbf{x}_0', note: 'apply <strong>A</strong> again' },
  ]"
  size="md"
/>
```

### Props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `name` | `string` (required) | n/a | Basename, without extension, of the compiled SVG in the deck's `tikz/` folder. The component loads `../tikz/<name>.svg` with `import.meta.glob`; a missing file renders an empty box. |
| `at` | `number[]` | unset | Timeline seconds for each click index. The last value clamps, so clicks beyond the array stay at the final time. |
| `stepSeconds` | `number` | `1.2` | Seconds per click, used only when `at` is omitted or empty. |
| `duration` | `number` | `650` | Length in ms of the eased seek between two clicks. `0` snaps. |
| `outline` | `boolean` | `false` | Draws a thin navy frame (white background, small padding) around the diagram. |
| `hideAt` | `number` | unset | From this click index on, the diagram fades out (opacity 0, 300 ms). |
| `alt` | `string` | `"Animated TikZ diagram"` | Becomes the `aria-label` of the wrapper (`role="img"`). |

In a template, props are kebab-case: `:step-seconds`, `:hide-at`.

### How a click becomes a time

For click index `n` (the slide's `$clicks`):

- with `at`: the time is `at[min(max(n, 0), at.length - 1)]`;
- otherwise: `max(0, n) * stepSeconds`.

The component pauses the SVG's animation clock on mount and calls
`setCurrentTime(t)` for the mapped time. On a click change it tweens from the
current time to the target with a cubic ease-out over `duration` ms. It snaps
instantly instead of tweening when:

- the click index jumped by more than one (progress bar, overview, deep link);
- the render context is not `slide` or `presenter` (for example the presenter's
  next-slide preview or the overview grid);
- `duration` is `0`.

The clock is re-seeked to the current click's time on window `focus`, on
`visibilitychange`, and before printing, unless a tween is in flight. This heals
a window that was hidden or throttled while the animation ran.

Because the diagram's own timeline is arbitrary, you choose where each click
lands. The authoring convention (see below) is that click `k` is at `1.2 * k`
seconds, which is the default `stepSeconds`, so most insets need no `at`.

### `hideAt` and the `.tikz-inset` wrapper

`hideAt` only fades the diagram. To also reclaim the space so content below
glides up, wrap the component in `.tikz-inset` (defined in `style.css`):

- `.tikz-inset` is a one-row CSS grid, centred, `width: var(--tikz-width, 46rem)`,
  `max-width: 100%`, with `pointer-events: none`;
- its row animates from `1fr` to `0fr` (350 ms) whenever it contains a
  `.tikz-sync--hidden` element, that is, once `hideAt` is reached;
- directly above a `GovDerivation` in `.gov-body` it adds a `0.35rem` top margin
  to the derivation.

Set the width per slide with `style="--tikz-width: 40rem"`.

### Id namespacing

TikZ SVGs contain ids that `<animate xlink:href="#...">` and `url(#...)` refer to.
Slidev renders the same slide in several places at once (audience, presenter,
previews), and inline SVGs in one document would all resolve to the first copy.
On mount the component appends a random per-instance suffix (`-tikz-xxxxxx`) to
every `id` and rewrites every `#id` and `url(#id)` reference in the SVG, so each
copy animates independently.

### Print and export

There is no print-specific stylesheet. The SVG clock is paused and seeked, so a
printed or exported page shows the frame for the click state being rendered
(`beforeprint` re-seeks it, and non-live render contexts snap without a tween).
To get one page per click step in a PDF, export with `--with-clicks`
(`npm run export:pdf-notes` does). Check the exported frame of any inset slide;
Slidev, not the component, decides which click state is rendered.

### Example

```md
---
layout: govuk
title: 'Two applications of A'
lead: 'Each click adds one application of the operator.'
clicks: 2
---

<div class="tikz-inset" style="--tikz-width: 40rem">
  <TikzSync name="example-chain" :at="[0, 1.2, 2.4]" :hide-at="3" alt="x0 maps to x1 maps to x2" />
</div>

<GovDerivation :steps="[…]" />
```

`clicks: 2` is needed only when nothing else on the slide (such as a
`GovDerivation`) provides the clicks. Without a click source the inset never
leaves click 0.

### Other forms

```html
<TikzSync name="foo" :step-seconds="1.2" :duration="400" />
<TikzSync name="foo" outline />
<TikzSync name="foo" :duration="0" />   <!-- snap, no tween -->
```

---

## The TikZ build pipeline

Edit TikZ sources in `tikz/src/*.tex` and run, from the deck directory:

```sh
npm run build:tikz
```

This runs `scripts/build-tikz.mjs`, which:

1. compiles every `tikz/src/*.tex` (sorted by name) to `tikz/<name>.svg` with
   [`node-tikzjax`](https://www.npmjs.com/package/node-tikzjax). It needs no
   local TeX install; the package bundles TeX Live 2020;
2. loads these TikZ libraries for every file:
   `animations`, `positioning`, `arrows.meta`, `decorations.pathreplacing`;
3. maps TeX font slot codes back to Unicode for the glyphs the deck uses (the
   glyph table, below);
4. remaps the Computer Modern family names onto the deck's KaTeX fonts.

Each file is built independently; on a failure the script prints
`tikz build failed: <file>` and rethrows.

`node-tikzjax` is a template devDependency, so run `npm install` in the deck
first.

### KaTeX font remap

TeX emits its own family names (`cmr10`, `cmmi7`, ...). The deck sets math with
KaTeX, whose faces are metric-compatible but are different files. The build
rewrites `font-family` attributes so inset labels and `GovDerivation` look like
one system:

| TeX family | Becomes |
|---|---|
| `cmbxti*` | `KaTeX_Main`, bold italic |
| `cmbx*` | `KaTeX_Main`, bold |
| `cmti*` | `KaTeX_Main`, italic |
| `cmr*` | `KaTeX_Main` |
| `cmmi*` | `KaTeX_Math`, italic |
| `cmsy*` | `KaTeX_AMS` |
| `cmssbx*` | `KaTeX_SansSerif`, bold |
| `cmss*` | `KaTeX_SansSerif` |
| `cmex*` | `KaTeX_Size1` |
| `cmtt*` | `KaTeX_Typewriter` |

Families that match none of these are left untouched.

### Glyph table and its limits

`node-tikzjax` writes raw TeX slot codes as characters. Under a Unicode font
those slots are the wrong glyphs (a phi shows as an apostrophe, a minus as an
inverted exclamation mark, `\mathcal` as plain capitals). `fixTexGlyphs` in the
script remaps the slots the deck uses:

| Font | Remapped |
|---|---|
| `cmmi*` | lowercase Greek, slots from 11 (`α β γ δ ϵ ζ η θ ι κ λ μ ν ξ π ρ σ τ υ ϕ χ ψ ω ε ϑ ϖ ϱ ς φ`) |
| `cmsy*` | `−`, `⋅`, `×`, `→`, `∞`, `∈` (set in `KaTeX_Main`); capitals A to Z become `\mathcal` (`KaTeX_Caligraphic`) |
| `cmr*`, `cmbx*` | ligatures `ff`, `fi`, `fl`, and the en and em dashes |

Anything outside this table still renders wrong. The authoring workarounds:

- draw `\cdots` as three filled circles;
- use a text apostrophe (`\textrm{'}`) for primes;
- draw glyphs the remap breaks (x, `*`, tilde, blackboard bold) by hand or
  replace them (`\dimlab`, `\textrm{*}`, `I\!R`);
- a remapped family applies only to single-glyph runs, because a text run is one
  font.

### Debugging

```sh
TIKZ_DEBUG=1 npm run build:tikz
```

`TIKZ_DEBUG=1` turns on `showConsole`, which prints the TeX log. Use it whenever
a compile fails.

### Authoring rules (`tikz/src/README.md`)

`node-tikzjax` bundles TeX Live 2020, so use TikZ's built-in `animations`
library with the explicit `animate={name:opacity={...}}` form. Newer packages
such as `svg-animate` are not available.

Every inset follows one animation language so the deck feels consistent. Click
`k` seeks the clock to `1.2*k` s, so each click's single fade runs in the 0.35 s
before `1.2*k` (`1.2k-0.35` to `1.2k`).

1. **One change per click.** A click introduces exactly one concept, never a
   sequence.
2. **Fade only** (opacity, about 0.3 s). No sliding, xshift reveals, growing
   arrows or wipes. Every element is laid out at its final position from the
   start, so space is reserved and nothing shifts. Keep the bounding box fixed.
3. **Between clicks nothing moves.**
4. **Shared vocabulary**, with identical style names at the top of every file:
   - `state`: white fill, navy 1.6 pt border, `\Large` bold label. `stateOn`
     (navy fill, white text) only while the derivation points at that box;
   - `op`: bold navy 2.2 pt arrow, same Latex head, label above in `opLab`
     (`\LARGE`). `opR`/`opLabR` is the crimson variant (reduced or secondary);
   - crimson marks the secondary, next-window or reduced object; light tints
     only for space bands;
   - `ghost`: dashed grey for "never built" or "replaced";
   - braces: `brN` (navy, above) and `brC` (crimson, below), 1.8 pt, labels in
     `brLabN`/`brLabC` (`\LARGE`). Symbols such as X, X', A, U, A_r use the
     same size everywhere.
5. **A scene change is one crossfade:** old fades out while new fades in, same
   0.3 s.

Write each element as `\begin{scope}[animate={myself:opacity={...}}]` with times
`0s=0, (1.2k-0.35)s=0, (1.2k)s=1, ...`.

### Complete example: `tikz/src/example-chain.tex`

This source builds `tikz/example-chain.svg`, used as
`<TikzSync name="example-chain" />`. Click 0 shows x0; click 1 adds A and x1;
click 2 adds A and x2 in crimson.

```latex
\definecolor{navy}{HTML}{0D2641}
\definecolor{crimson}{HTML}{D71C56}
% Example inset for <TikzSync name="example-chain" />. Click k seeks the clock
% to 1.2k s; each click's single fade runs in (1.2k-0.35)s .. (1.2k)s.
%   click 0: x_0        click 1: + A, x_1        click 2: + A, x_2 (crimson)
% Shared style vocabulary — keep identical across insets (README "Animation rules").
\begin{document}
\begin{tikzpicture}[
  font=\Large,
  state/.style={draw=navy, line width=1.6pt, rounded corners=3pt, fill=white,
    minimum size=1.4cm, inner sep=0pt},
  stateOn/.style={state, fill=navy, text=white},
  op/.style={-{Latex[length=3.2mm,width=3mm]}, draw=navy, line width=2.2pt},
  opR/.style={op, draw=crimson},
  ghost/.style={op, draw=navy!35, dashed, line width=1.6pt},
  opLab/.style={text=navy, font=\LARGE},
  opLabR/.style={text=crimson, font=\LARGE},
  brN/.style={decorate, decoration={brace, amplitude=7pt}, draw=navy, line width=1.8pt},
  brC/.style={decorate, decoration={brace, amplitude=7pt, mirror}, draw=crimson, line width=1.8pt},
  brLabN/.style={text=navy, font=\LARGE},
  brLabC/.style={text=crimson, font=\LARGE},
]
\node[state] at (-3.4,0) {$\mathbf{x}_0$};
\begin{scope}[animate={myself:opacity={0s="0", 0.85s="0", 1.2s="1", 100s="1"}}]
\draw[op] (-2.55,0) -- node[above=3pt, opLab] {$\mathbf{A}$} (-0.85,0);
\node[state] at (0,0) {$\mathbf{x}_1$};
\end{scope}
\begin{scope}[animate={myself:opacity={0s="0", 2.05s="0", 2.4s="1", 100s="1"}}]
\draw[opR] (0.85,0) -- node[above=3pt, opLabR] {$\mathbf{A}$} (2.55,0);
\node[state, draw=crimson] at (3.4,0) {$\mathbf{x}_2$};
\end{scope}
\end{tikzpicture}
\end{document}
```

Note that there is no `\documentclass`: the file starts with colour definitions
and `\begin{document}`. Elements that must be visible from the start (the first
state box) sit outside any animated scope. The pattern for a later element is
`0s="0", (1.2k-0.35)s="0", (1.2k)s="1", 100s="1"`.

### Workflow end to end

```sh
# 1. write tikz/src/my-inset.tex  (copy example-chain.tex as a starting point)
npm run build:tikz           # writes tikz/my-inset.svg
npm run dev                  # place <TikzSync name="my-inset" /> on a slide
```

Commit both the `.tex` and the generated `.svg`: the component imports the SVG.

---

## D3Figure

`components/D3Figure.vue` mounts a **live, animated D3 figure by reference**.
The figure lives in its own project outside the deck, and its stages advance with
the deck's own right and left arrow presses. Forward plays the next stage;
backward plays the current stage in reverse.

### Props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `script` | `string` (required) | n/a | URL of the figure script under `public/`, for example `/diagrams/motivation-figure.js`. |
| `global` | `string` (required) | n/a | Name of the `window` key that exposes `{ mount }`, for example `MotivationFigure`. |
| `d3` | `string` | `/diagrams/d3.min.js` | URL of the d3 build, loaded before the figure script. |
| `fallback` | `string` | unset | Settled-frame PNG shown instead of the live figure when printing or exporting. |
| `mountOpts` | `Record<string, unknown>` | unset | Extra options passed to `mount()`, merged after `{ steps: 'clicks' }`. Use for theme flags and figure-specific toggles. |
| `alt` | `string` | `"Animated figure — advance with the slide clicks"` (live region); `"Settled frame of the animated figure"` (print image) | Alt text for the live region and for the fallback image. |

### How stages map to clicks

The slide must declare `clicks: N` in its frontmatter, where **N is the number
of stages minus one**. A three-stage figure needs `clicks: 2`. Stage 1 is the
resting frame shown at click 0, and stage `n + 1` is shown at click `n`.

On mount the component loads d3 then the figure script (each script URL is
loaded once per page; the cache is kept on `window.__d3FigureLoads`), calls
`window[global].mount(el, { steps: 'clicks', ...mountOpts })`, and immediately
calls `jumpTo($clicks + 1)` so a deep link or hot reload lands on the right
frame. Then a watcher on `$clicks` handles changes:

| Situation | Behaviour |
|---|---|
| Render context is not `slide` or `presenter` (next-slide preview, overview, print) | `jumpTo(n + 1)`: exact frame, no animation |
| Click increased | `next()`, then `jumpTo(n + 1)` if the stage still differs (multi-click jump) |
| Click decreased | `prev()` (plays the stage backwards), then `jumpTo(n + 1)` if it returned false or the stage still differs (mid-flight or multi-click jump) |

On window `focus` and `visibilitychange` the component snaps to `$clicks + 1`
when the figure is idle (`busy()` false), so an occluded window that missed the
end of an animation recovers. It never cuts a live animation. If the script
fails to load or `mount` throws, the error is logged with the `d3=` and `api=`
types and the print fallback stays visible. On unmount it calls
`controller.cleanup()`.

### Print and export fallback

Animation cannot survive `slidev export`. The component renders both the live
container and an `<img class="print-fallback">` (when `fallback` is set). Under
`@media print` the live figure is hidden and the PNG is shown. Regenerate the PNG
after every figure edit, because it is a snapshot (`node snap.mjs` in the
figure's own directory).

### Complete slide example

```md
---
layout: govuk
title: 'The slide assertion'
lead: 'One time slice, the observed past, then the dynamics run past the cutoff.'
clicks: 2
---

<D3Figure
  script="/diagrams/motivation-figure.js"
  global="MotivationFigure"
  fallback="/diagrams/out/motivation-figure-static.png"
  alt="One time slice, the observed past, the dynamics run past the cutoff"
/>

<p class="govuk-caption" style="text-align:center;">
  press → to advance the stages · ← reverses
</p>

<!-- speaker notes -->
```

### Directory layout and the symlink

```
<repo-root>/diagrams/<slug>/       the figure's own project, outside the deck
  ├─ <slug>-figure.js              classic script exposing window.<Name> = { mount }
  ├─ <slug>-figure.html            standalone hero page (?static = settled frame)
  ├─ snap.mjs                      screenshots the settled frame into out/
  └─ out/                          PNG/SVG exports incl. the print fallback

<deck>/public/diagrams  ->  ../../diagrams/<slug>      (symlink, never copy)
<deck>/components/D3Figure.vue                         (from the kit template)
```

```sh
ln -sfn ../../diagrams/<slug> <deck>/public/diagrams
```

`public/**` is served verbatim, so editing the figure hot-reloads the slide. For
several figures use one symlink each, for example `public/fig-<slug>`, and pass
the matching URLs in `script` and `fallback`. The template `vite.config.ts` allows
the dev server to serve files through a symlinked diagrams folder.

### The figure-side contract (`snippets/d3-figure-embedder.js`)

The figure is a **classic (non-module) script**, loaded with a `<script>` tag
after d3: no imports, no bundler. It exposes one API:

```js
window.<Name> = { mount }        // mount(container, opts?) -> controller
```

`mount` accepts a selector or element and returns the controller:

| Member | Meaning |
|---|---|
| `next()` | Play the next stage forward; queue one advance if a stage is playing; `false` when exhausted |
| `prev()` | Play the current stage backwards; `false` at stage 1 or mid-flight (the host then calls `jumpTo`) |
| `jumpTo(n)` | Render exactly stages 1..n instantly (stages above n reset to their start state) |
| `stage()` | Current stage, 1-based |
| `busy()` | `true` while a playback ticker is live (optional in old figures) |
| `cleanup()` | Stop the ticker; called on unmount |

Options: `opts.steps` is `'auto'` (default; the standalone hero page plays the
whole timeline on load) or `'clicks'` (the slide drives everything).
`opts.static`, or the `?static` URL flag, renders the settled frame.

Copy `snippets/d3-figure-embedder.js` for the full skeleton (ticker,
`playStage`, `playStageBackward`, controller). The template registers itself as
`window.FigureEmbedder`; rename that to your figure's API name.

Five laws make reverse playback, resync and multi-window staging work. Do not
break them:

1. **Every stage event's `apply(e)` is a pure function of progress `e` in
   [0, 1].** Nothing tweens by itself, so the same code runs forward (0 to 1)
   and backward (1 to 0).
2. **Stage 1 is the resting frame**, applied synchronously in clicks mode, so a
   freshly mounted slide shows a complete figure at zero clicks.
3. **All timeline state is function-scoped** (`script`, `anims`, `animTimer`,
   `stage`) and declared above the controller closures.
4. **At most one playback at a time.** `next`, `prev` and `jumpTo` each stop the
   ticker and clear queued events before starting. Overlapping playbacks make
   different windows settle on different frames.
5. **No module-level mutable render state.** Presenter mode mounts the figure
   several times in one window (current panel, next preview, overview), and a
   shared variable lets one instance rewrite another's geometry.

Write the timeline as flat events:

```js
const script = [];   // { stage, delay, dur, ease, apply }
const animate = (stage, delay, dur, ease, apply) => script.push({ stage, delay, dur, ease, apply });

animate(1, 250, 700, d3.easeCubicOut, e => growBar(heroColumn, e));   // resting frame
animate(2, 2600, 620, d3.easeCubicOut, e => growBar(yearBar, e));     // stage 2
animate(3, 6300, 700, d3.easeCubicOut, e => growBar(futureBar, e));   // stage 3
```

Reverse playback mirrors the stagger (last in, first out), and `jumpTo` must be an
exact render:

```js
// wrong: later-stage elements linger after back-navigation
for (const e of script) if (e.stage <= n) e.apply(e.ease(1));
// right: stages > n reset to their start state, and stage = n (not Math.max)
for (const e of script) e.apply(e.stage <= n ? e.ease(1) : e.ease(0));
```

### Verification

Headless, against a running dev server (run from the deck directory):

```sh
node <kit>/skills/slidev-presentation/scripts/drive-figure.mjs \
  http://localhost:3030/<slide> "R:4200,R:4200,L:4500,L:4200"
```

It screenshots the resting frame, then each key press (`R` is ArrowRight, `L` is
ArrowLeft) after the given wait in ms, and prints a `pageerrors:` line. The only
acceptable error is the benign headless `Wake Lock permission request denied`.
After a reverse step the figure must match the earlier stage exactly. See
[Presenting & sync](presenting.html) for `check-sync.mjs`.

### Pitfalls

- Import `useSlideContext` from the `@slidev/client` root; the
  `@slidev/client/context` subpath breaks Vite pre-transform.
- `d3.interval` tickers outlive the slide, so `cleanup()` must stop them.
- Drive stages only through the `$clicks` watcher. Do not mix per-element
  `<v-click>`s on the same slide; the click budgets desync.
- `clicks: N` must equal stages minus one, otherwise the right arrow leaves the
  slide mid-story or the left arrow dies at stage 1.
- A figure that differs between windows while the slide number agrees is an
  animation race (laws 4 and 5), not a sync bug.
- Two live mounts of the same figure draw two SVGs; add a container guard in
  `draw` if you need that.
- `Failed to patch FloatingVue ... reading 'Popper'` in the dev console is a
  benign theme warning.

---

## Static figures and sub-session delegation

Native `gov-*` primitives and `mermaid` cover most conceptual slides. When a
slide needs a real figure (a data plot, a precise schematic, a network or
timeline that mermaid cannot draw), build it with the skills in
`~/Projects/diagram-skills` by spawning a headless `pi` sub-session instead of
hand-writing SVG in `slides.md`.

**Delegate when** the figure is a data plot (bar, line, scatter, heatmap,
distribution), needs typeset math or precise placement (TikZ), needs D3 features
mermaid lacks, or will also live in a paper. **Do not delegate** when a `gov-*`
component or mermaid does the job.

### The wrapper

```sh
make-diagram.sh <deck-dir> <d3|tikz> <slug> "MESSAGE sentence | data/structure notes" \
  [--formats svg,png] [--dark]
```

- `<slug>` is required: output goes to `<deck-dir>/public/diagrams/<slug>/`.
- `--formats` (default `svg,png`) is passed to the render pipeline; `--dark`
  asks for both themes (only for dark decks).
- `DIAGRAM_SKILLS` overrides the diagram-skills path (default
  `~/Projects/diagram-skills`).
- The sub-session runs `pi --no-session --print -ns --skill <skill> --tools
  read,bash,edit,write`, so only the d3 or tikz diagram skill loads.

Give the sub-session one claim sentence (same discipline as the slide's `lead:`),
the output directory, the data or structure inline, and the venue ("presentation
slide, light background"). It writes only into the output directory and reports
the written paths; the stable paths are `<out>/diagram.svg` and
`<out>/diagram.png`.

Then verify the files exist, read the PNG, and embed it:

```md
---
layout: govuk-image-right
title: 'Error grows with horizon'
image: /diagrams/error-vs-horizon/diagram.png
---
```

or `![](/diagrams/<slug>/diagram.png)`. Run the lint and export gate afterwards.

Styling: keep the diagram-skills colour-blind-safe palette and re-render rather
than hand-editing SVG colours. One figure is one message is one slide's focal
point; the figure replaces the bullets. A sub-session takes minutes, so batch
several in parallel (one per figure) and run the wrapper detached.

See [Workflow & scripts](workflow.html#make-diagramsh) for the script itself.

---

## Custom click-driven figures

For a data figure that plays through time (a forecast running year by year) and
that neither TikzSync nor D3Figure fits, write a Vue SFC using this recipe
(taken from `references/components.md`):

```ts
const { $clicks, $renderContext } = useSlideContext()
const hf = ref(1)                      // fractional time index driving the figure
watch($clicks, (c) => {
  if (c >= 1) {
    if ($renderContext.value !== 'slide') { hf.value = END; return } // print/overview: settled
    play()                              // requestAnimationFrame tween hf -> END
  } else { stop(); hf.value = 1 }
}, { immediate: true })
onBeforeUnmount(stop)
```

Guidelines:

- Keep data in a sibling JSON file (`import D from './movers.json'`) and draw
  with plain SVG in the template.
- Between discrete steps, stay fade-only: cross-fade per-step layers rather than
  sliding marks.
- Static exports must show the settled end state, which is why every non-`slide`
  render context jumps straight to the end value.
- Follow the kit conventions for new components: one SFC per file in
  `components/` (auto-imported by filename), props carry data, no styling inside
  the component beyond what is scoped and necessary, and a demo slide plus a
  green `lint-deck.py`.

### Complete copy-paste component

`components/YearPlay.vue`:

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'   // root import, not the /context subpath

const props = withDefaults(defineProps<{
  series: number[]        // one value per year
  firstYear: number
  duration?: number       // ms for the full play
}>(), { duration: 2400 })

const { $clicks, $renderContext } = useSlideContext()
const END = props.series.length - 1
const hf = ref(0)         // fractional index into the series
let raf = 0

function stop() { cancelAnimationFrame(raf); raf = 0 }
function play() {
  stop()
  const from = hf.value
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / props.duration)
    hf.value = from + (END - from) * (1 - (1 - p) ** 3)
    raf = p < 1 ? requestAnimationFrame(tick) : 0
  }
  raf = requestAnimationFrame(tick)
}

watch($clicks, (c) => {
  if (c >= 1) {
    if ($renderContext.value !== 'slide') { stop(); hf.value = END; return }
    play()
  } else {
    stop()
    hf.value = 0
  }
}, { immediate: true })
onBeforeUnmount(stop)

const W = 800, H = 360
const max = Math.max(...props.series)
const bars = computed(() => props.series.map((v, i) => ({
  x: 20 + i * ((W - 40) / props.series.length),
  w: (W - 40) / props.series.length - 6,
  h: (v / max) * (H - 60),
  year: props.firstYear + i,
  on: i <= hf.value,
})))
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" style="width: 100%; height: auto" role="img">
    <g v-for="b in bars" :key="b.year" :opacity="b.on ? 1 : 0.12">
      <rect :x="b.x" :y="H - 30 - b.h" :width="b.w" :height="b.h" fill="#0D2641" />
      <text :x="b.x + b.w / 2" :y="H - 10" text-anchor="middle" font-size="14">{{ b.year }}</text>
    </g>
  </svg>
</template>
```

Use it on a slide that has one click:

```md
---
layout: govuk
title: 'The forecast runs forward'
lead: 'One click plays the series from the first year to the last.'
clicks: 1
---

<YearPlay :series="[3, 5, 8, 13, 21, 34]" :first-year="2018" />

<!-- speaker notes -->
```
{% endraw %}
