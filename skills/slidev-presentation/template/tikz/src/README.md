# Animated TikZ sources

Edit `*.tex` here, then run:

```sh
npm run build:tikz
```

This compiles each file to `../<name>.svg` with `node-tikzjax` (no local TeX
install). The SVG keeps TikZ's SMIL `<animate>` timelines, which
`components/TikzSync.vue` seeks from the slide's clicks.

`node-tikzjax` bundles TeX Live 2020, so use TikZ's built-in `animations`
library (and the explicit `animate={name:opacity={…}}` form). Newer packages
such as `svg-animate` are not available.

If a compile fails, run `TIKZ_DEBUG=1 npm run build:tikz` to print the TeX log.

The build also remaps TeX's Computer Modern families onto the deck's KaTeX
fonts, so diagram labels match `GovDerivation` math. It loads `animations`,
`positioning`, `arrows.meta`, and `decorations.pathreplacing`. It also maps
TeX font slots back to Unicode for lowercase Greek, `\mathcal` capitals, `−`,
`⋅`, `×`, `→`, `∞`, `∈`, ligatures and text dashes (`CM_GLYPHS` in the script);
anything outside that table still renders wrong: draw `\cdots` as three filled
circles and use a text apostrophe (`\textrm{'}`) for primes.

## Animation rules

Every inset follows one animation language so the deck feels
consistent. Click `k` seeks the SVG clock to `1.2*k` s (400 ms tween), so each
click's single fade runs in the 0.35 s just before `1.2*k` (`1.2k-0.35` to `1.2k`).

1. One change per click. A click introduces exactly one concept; never a sequence.
2. Fade only (opacity, ~0.3 s). No sliding, xshift reveals, growing arrows or
   wipes. Every element is laid out at its final position from the start, so
   space is reserved and nothing shifts. Keep the bounding box fixed.
3. Between clicks nothing moves.
4. Shared vocabulary (identical style names at the top of every file):
   - `state`: white fill, navy 1.6 pt border, `\Large` bold label. `stateOn`
     (navy fill, white text) only while the derivation points at that box.
   - `op`: bold navy 2.2 pt arrow, same Latex head, label above in `opLab`
     (`\LARGE`). `opR`/`opLabR` is the crimson variant (reduced/secondary).
   - Crimson marks the secondary / next-window / reduced object; light tints
     only for space bands.
   - `ghost`: dashed grey for "never built / replaced".
   - Braces: `brN` (navy, above) and `brC` (crimson, below), 1.8 pt, labels in
     `brLabN`/`brLabC` (`\LARGE`). X, X', A, U, A_r use the same size everywhere.
5. A scene change is one crossfade: old fades out while new fades in, same 0.3 s.

Write each element as `\begin{scope}[animate={myself:opacity={...}}]` with times
`0s=0, (1.2k-0.35)s=0, (1.2k)s=1, ...`; `example-chain.tex` shows the
pattern. Glyphs the font remap breaks (x, *, tilde, blackboard bold) are
drawn by hand or replaced (`\dimlab`, `\textrm{*}`, `I\!R`).

## Placing an inset on a slide

```html
<div class="tikz-inset" style="--tikz-width: 40rem">
  <TikzSync name="example-chain" :at="[0, 1.2, 2.4]" :hide-at="3" />
</div>
<GovDerivation :steps="[…]" />
```

`TikzSync` registers no clicks of its own: it follows the slide's click count,
so the inset stays in lockstep with a `GovDerivation` on the same slide. With
`hide-at`, the `.tikz-inset` row collapses and the derivation glides up.
