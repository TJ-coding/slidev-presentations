---
title: GovDerivation
parent: Components
nav_order: 1
---

# GovDerivation

## Overview

`GovDerivation` animates an equation through a sequence of LaTeX steps, in the style of 3Blue1Brown / Manim's `TransformMatchingTex`. Each click (or arrow-key advance) morphs the equation to the next step: tokens that exist in both steps glide to their new position, new tokens fade in briefly flashed crimson, and removed tokens fade out quickly. Steps the derivation has already passed are written as a small "ledger" next to the equation so latecomers can follow, and optional callouts can annotate the ledger once the derivation is complete. The component registers its own click slots on the slide, so it works without any `v-click` wiring and slides that do not use it are unaffected.

## Quick start

```html
<GovDerivation
  :steps="[
    'ax^2 + bx + c = 0',
    { tex: 'x^2 + \\frac{b}{a}x = -\\frac{c}{a}', note: 'divide by $a$, move the constant' },
    'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  ]"
/>
```

The slide now takes two extra clicks (one per morph, so `steps.length - 1`); it rests on the last step. A step is either a LaTeX string or an object (see [Step object reference](#step-object-reference)).

Inside `:steps="[...]"` you are writing a JavaScript string inside Slidev Markdown, so every TeX backslash is doubled: `'\\frac'`, `'\\mathbf{A}'`. See [Troubleshooting](#troubleshooting).

## Props reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `(string \| DerivationStep)[]` | required | The derivation. A string is shorthand for `{ tex: string }`. |
| `duration` | `number` (ms) | `700` | Morph duration. Removed tokens fade out on a faster clock, `duration * 0.2` (exposed as `--gd-exit-dur`). |
| `size` | `'md' \| 'lg' \| 'xl'` | `'lg'` | Equation font size: `1.35rem`, `1.8rem`, `2.4rem` (via `--gd-size`). |
| `showProgress` | `boolean` | `true` | Progress dots under the equation. Only rendered when there is more than one step. |
| `showHistory` | `boolean` | `true` | Show the ledger of completed steps. Callouts need the ledger (they point at its lines). |
| `historyPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Where the ledger sits relative to the equation. |
| `historyOrder` | `'oldest-first' \| 'newest-first'` | oldest-first (prop unset) | Ledger stacking. `oldest-first`: lines in derivation order. `newest-first`: the newest line is at the far end and older ones slide toward the equation. Ignored when any step sets `histIndex`. |
| `historySize` | `number \| string` | unset (CSS default `0.58`) | Ledger font size. A number is an em multiplier of the equation size (sets `--gd-hist-scale`); a string is a raw CSS length such as `'0.8rem'` (sets `--gd-hist-size`). |
| `historyOpacity` | `number` | unset (CSS default `1`) | Opacity of ledger lines (sets `--gd-hist-opacity`). The ink itself is already muted (`--steel`). |
| `historyAlign` | `string \| string[]` | unset | Default marker(s) at which every ledger line aligns, like LaTeX `align`. A list or a comma-separated string names several markers; each line splits at the leftmost one it contains. Unset means each line is centred on its own. |
| `boxed` | `boolean` | `false` | Draw an animated focus box around the current equation. |
| `morphMap` | `Record<string, string>` | unset | Declares token identity: tokens whose tex maps to the same canonical id morph into each other. |
| `annotations` | `{ step?, id?, stepId?, text }[]` | unset | Callouts shown once the final step is reached, each pointing at one ledger line. See [Annotations](#annotations-callouts). |
| `at` | `number` | unset | Absolute click at which the derivation starts (shows step 0); morphs happen at `at + 1, at + 2, ...`. Overrides a numeric `v-click="N"` on the component. |

In a Vue/Slidev template, camelCase props can be written kebab-case (`history-position="right"`, `:history-size="0.7"`). Non-string props need the `:` binding (`:duration="500"`, `:show-progress="false"`); string props can be plain attributes. A bare attribute like `boxed` means `true`.

### Annotation object

| Field | Type | Description |
|---|---|---|
| `text` | `string` | Callout text. `$...$` spans render as inline math; `<strong>`/`<em>`/`<br>` work as in notes. |
| `id` | `string` | Anchor to the step whose `id` matches. Stable when steps are inserted or reordered. |
| `stepId` | `string` | Alias of `id`. If both are given, `stepId` wins. |
| `step` | `number` | Anchor by 0-based index into `steps`. Used only when neither `id` nor `stepId` is set. |

An annotation with no usable anchor, an unknown `id`, or an anchor step that has no ledger line is silently dropped. Callouts are numbered 1, 2, ... in the order of the `annotations` array.

## Step object reference

A step is a string or an object. Only `tex` is required.

| Field | Aliases | Type | Description |
|---|---|---|---|
| `tex` | | `string` | LaTeX for this step. An empty (or whitespace-only) `tex` is an [empty step](#empty-steps). A trailing `\tag{n}` / `\tag*{n}` is extracted (see `tag`). A top-level `\\` wraps the equation onto centred lines. |
| `note` | | `string` | Caption under the equation. Supports `$...$` math, `<strong>`/`<em>` (and `<b>`/`<i>`), `<br>` or a newline. Also used in the ledger unless `histNote` is set. A note identical to the previous step's stays put rather than re-fading. |
| `tag` | | `string \| number` | Equation number shown as `(n)` in the ledger. Takes precedence over a `\tag{...}` found in `tex`. |
| `id` | | `string` | Identifier that `annotations` can anchor to (`id` / `stepId`). Used for nothing else. |
| `history` | | `boolean` | `false` keeps this step out of the ledger (e.g. a very tall matrix line). Default: included. |
| `histTex` | `historyTex` | `string` | LaTeX for this step's ledger line instead of `tex` (a compact form). If both are set, `histTex` wins. A `\tag{}` inside is stripped too. |
| `histNote` | `historyNote` | `string` | Note for the ledger line instead of `note`. Resolved with `??`, so an empty string `''` is kept and hides the ledger note; leave it unset to fall back to `note`. |
| `histAlign` | `historyAlign`, `align` | `string \| string[] \| false` | Align this ledger line at a marker (`'='`, `'\\approx'`, `'&'`, ...). A list or comma-separated string allows several markers. `false` opts this line out of the component-level `historyAlign`. Precedence: `histAlign`, then `historyAlign`, then `align`, then the component prop. |
| `histIndex` | `histAt`, `historyAt` | `number` | Insert this line at that 0-based ledger slot, counted from the oldest line, when the step completes (instead of appending). Clamped to the current depth. Precedence: `histIndex`, `histAt`, `historyAt`. |
| `section` | | `string` | Label of the derivation phase; the ledger groups all steps naming the same label under one bold heading. Supports `$...$`. |

Notes on the table:

- Step objects are copied; your array is never mutated.
- The step currently on stage is never in the ledger. A step enters the ledger once the derivation has moved past it.
- `id` is read by the component but is missing from the `DerivationStep` TypeScript interface in the source, so a type-checker may complain about it in typed contexts; it works at runtime.

## Feature guides

### Morphing and token identity

Tokens are matched across steps by their source text (`x`, `\frac{b}{a}`, `x^2`, ...). Matched tokens glide to the new place; unmatched new tokens fade in crimson; unmatched old tokens fade out. Use this for the default behaviour: simply write the steps and let identical pieces carry over.

```html
<GovDerivation
  :steps="[
    'x + 3 = 7',
    'x + 3 - 3 = 7 - 3',
    'x = 4',
  ]"
/>
```

How tokens are paired (so you can predict it): first, tokens declared in `morphMap` are paired occurrence by occurrence (the k-th old occurrence continues as the k-th new one, crossing other tokens if needed). Then everything else is paired by greedy longest-common-block matching: the longest run of tokens shared contiguously moves as one rigid chunk, and the remaining stretches on each side recurse; ties on length go to the smaller total travel distance. Repeats of the same token within a step get ids `tok`, `tok#1`, `tok#2`, ... and pair in order.

### morphMap: renaming a symbol across steps

Use when a symbol changes form but is conceptually the same object, so it should morph instead of vanish and reappear.

```html
<GovDerivation
  :steps="[
    '\\mathbf{X}^\\prime \\approx \\mathbf{A}\\mathbf{X}',
    '\\mathbf{X}^\\prime \\approx \\mathbf{A}_r\\mathbf{X}',
  ]"
  :morph-map="{ '\\mathbf{A}': '\\mathbf{A}_r' }"
/>
```

Keys are token tex; values are canonical ids. Both sides are normalised, so `x_2` and `x_{2}`, or `_\text{state}` and `_{\text{state}}`, are treated alike. Declared ids take priority over the automatic matching, even when letting a symbol stay put would travel less. Note that the right-hand value is itself a canonical id: tokens whose own tex already equals that value also join the group.

Decorations are handled automatically: `\underbrace{\mathbf{x}_t}_{...}` and `\overbrace{...}^{...}` keep the identity of their core (`\mathbf{x}_t`), so adding a brace label to a symbol makes that symbol stay and the brace wrap it, with no map entry needed.

### Notes

Use a note to say in words what changed. It renders under the equation and cross-fades per step.

```html
<GovDerivation
  :steps="[
    { tex: '\\mathbf{A}x = b', note: 'start from the linear system' },
    { tex: 'x = \\mathbf{A}^{-1}b', note: 'apply $\\mathbf{A}^{-1}$ on <strong>both</strong> sides<br>(assuming $\\mathbf{A}$ is invertible)' },
  ]"
/>
```

Inside notes: `$...$` is inline KaTeX math; `\$` is a literal dollar sign; an unbalanced `$` stays literal; `<strong>`, `<em>`, `<b>`, `<i>` and `<br>` (or a plain newline) pass through; any other tag is shown as escaped text. The ledger uses `note` too, or `histNote` if given:

```html
<GovDerivation
  :steps="[
    { tex: '\\varphi(f(\\mathbf{x})) = \\mathcal{K}\\varphi(\\mathbf{x})',
      note: 'Koopman operator $\\mathcal{K}$: linear, but infinite-dimensional',
      histNote: 'Koopman operator' },
  ]"
/>
```

### Multi-line equations

A top-level `\\` in `tex` wraps the step onto centred lines. Backslash pairs inside braces or environments (`\underbrace{...\\...}`, `\begin{bmatrix}...\\...`) do not cut. An optional `\\[1em]` spacing argument is consumed with the break. Tokens still morph across lines. Because of the doubled escaping, a line break is written `\\\\` in a prop.

```html
<GovDerivation
  :steps="[
    { tex: 'x = y \\\\ \\Rightarrow z = 2y' },
    { tex: 'x = y \\\\ \\Rightarrow z = 2y \\\\ \\Rightarrow z = 2x' },
  ]"
/>
```

Use for long derivations that would overflow the slide width.

### Equation tags

`\tag{n}` (or `\tag*{n}`) at any position in `tex` (the first one found) is removed from the equation, because it would split the token stream, and shown as `(n)` next to the line in the ledger. Set `tag` on the step to override or to use a number.

```html
<GovDerivation
  :steps="[
    { tex: 'E = mc^2 \\tag{1}', note: 'see (1)' },
    { tex: 'E = \\gamma m_0 c^2', tag: 2 },
    '',
  ]"
/>
```

The tag is displayed in the ledger only; the large current equation does not show it. `\tag` contents cannot contain nested braces (the pattern is `\tag{...}` with no inner braces).

### History ledger

On by default. Every completed step is written small beside the equation, so the audience can catch up. Control it with `showHistory`, `historyPosition`, `historyOrder`, `historySize` and `historyOpacity`; opt single steps out with `history: false`.

```html
<GovDerivation
  :steps="[
    'a = b',
    { tex: 'a + c = b + c', history: false },
    'a + c = b + c = d',
  ]"
  history-position="right"
  :history-size="0.7"
  :history-opacity="0.55"
/>
```

Use `history: false` for tall lines such as matrices; use `histTex` to substitute a compact form instead, so the ledger still records the step:

```html
<GovDerivation
  :steps="[
    { tex: '\\mathbf{X} = \\begin{bmatrix} x_1 & x_2 \\\\ x_3 & x_4 \\end{bmatrix}',
      histTex: '\\mathbf{X} = [\\,x_1 \\cdots x_4\\,]', histNote: 'snapshot matrix' },
    '\\mathbf{X}^\\top',
  ]"
/>
```

Ledger positions: `top` (default; the newest line lands directly against the equation), `bottom`, `left`, `right` (stacks downward beside the equation). New lines slide in away from the equation, with the direction following the side. `historyOrder="newest-first"` reverses the stack so the newest line is at the far end.

### Aligned ledger lines

Use `historyAlign` (all lines) or `histAlign` (per line) to line the ledger up on a marker, like LaTeX `align`: lines split into a right-aligned left part, a centred marker, and a left-aligned right part, sharing columns. Lines that lack every marker stay centred (the grid is used only if at least one visible line aligns).

```html
<GovDerivation
  :steps="[
    { tex: 'x + y = 3' },
    { tex: '2x + 3y = 12' },
    { tex: 'y \\approx 6 - 2x' },
    '',
  ]"
  history-align="=,\approx"
/>
```

Details:

- Several markers: `history-align="=,\approx"`, or in a binding `:history-align="['=', '\\approx']"`. The line splits at the leftmost marker it contains.
- A marker of `&` is an invisible split (the classic align ampersand); any other marker is shown in its own column.
- The split is found at the top level only: braces `{...}` and `\begin...\end` environments are skipped, so a `=` inside `\text{...}` or a matrix cell is not a split point.
- Per-step `histAlign: false` opts a line out of the component's `historyAlign`; `histAlign: '='` opts a single line in.
- Alignment uses the ledger text (`histTex` if set, else `tex`).
- Plain HTML attribute strings are not JavaScript: write `history-align="=,\approx"` with a single backslash in an attribute, but `'\\approx'` with two inside a `:binding` or in a step object.

### Sections

Use `section` to group the ledger into labelled phases.

```html
<GovDerivation
  :steps="[
    { tex: 'x = a + b', section: 'Set-up' },
    { tex: 'y = 2x' },
    { tex: 'z = x + y', section: 'Reduce' },
    { tex: 'z = 3x' },
    '',
  ]"
/>
```

Steps naming the same label share one block; blocks appear in order of the label's first appearance. A step without `section` joins the most recently declared section by ledger position (not derivation order, which matters with `histIndex`). Steps before any declared section sit under an unheaded block. A heading appears only after the declaring step has been passed, never while that equation is still on stage. Section labels accept `$...$` math.

### Pinning ledger positions with histIndex

A step normally appends to the ledger. `histIndex` inserts its line at a 0-based slot counted from the oldest line when the step completes; later lines shift down with animation. The slot is clamped to the current depth.

```html
<GovDerivation
  :steps="[
    { tex: 'a = 1' },
    { tex: 'b = 2' },
    { tex: 'c = 3', histIndex: 0 },
    { tex: 'd = 4' },
    '',
  ]"
/>
```

Use it to retroactively place a definition at the top of the ledger. When any step sets `histIndex` (or the aliases `histAt` / `historyAt`), `historyOrder` is not applied.

### Focus box

`boxed` draws a framed box around the current equation. The box is an overlay that glides to each step's size, so the frame does not jump while tokens morph. It is hidden on an empty step.

```html
<GovDerivation :steps="['a^2 + b^2', 'a^2 + b^2 = c^2']" boxed />
```

This is separate from `\boxed{...}` in the LaTeX (see [Writing LaTeX that morphs well](#writing-latex-that-morphs-well)), which boxes part of the equation itself.

### Empty steps

A step whose `tex` is empty (or only whitespace) clears the stage: the equation area collapses with animation and the ledger glides into the freed space; the box disappears. Put an empty step last to end the derivation on the complete ledger (this is also what the callouts typically point at):

```html
<GovDerivation :steps="['a = 1', 'a + b = 3', { tex: '', note: '' }]" />
```

### Annotations (callouts)

`annotations` shows numbered callout boxes in a right-hand gutter once the derivation reaches its last step. Each box is connected by an elbow leader to the ledger line of the step it explains. Boxes are nudged vertically so they never overlap. Anchor by `id` (stable under reordering) or by index with `step`.

```html
<GovDerivation
  :steps="[
    { tex: 'E = mc^2', id: 'einstein' },
    { tex: 'p = \\gamma m v', id: 'momentum' },
    '',
  ]"
  history-position="bottom"
  :annotations="[
    { id: 'einstein', text: 'mass-energy equivalence' },
    { step: 1, text: 'relativistic momentum, with $\\gamma = 1/\\sqrt{1 - v^2/c^2}$' },
  ]"
/>
```

Requirements and behaviour:

- Callouts need the ledger (`showHistory` true) and the anchor step must have a ledger line: not `history: false`, and not the very last step (the current step is never in the ledger). Hence the trailing empty step in typical use.
- They appear about `2 * duration + 60` ms after the final step is reached, once the equation area has collapsed and the ledger has moved left to make room.
- They are positioned in local slide coordinates, corrected for Slidev's CSS scaling, and re-measured on resize.

### Click budget and absolute start (`at`, `v-click`)

The component registers `steps.length - 1` click slots at mount, in DOM order: `v-click` elements placed before it keep the earlier clicks, ones after it come later. Add or remove steps and the budget follows (also during hot reload).

If you need the derivation to start at a specific absolute click (for example when it is wrapped, or other elements reveal around it), either put a numeric `v-click` on it or pass `at`:

```html
<GovDerivation v-click="3" :steps="[...]" />
<GovDerivation :at="3" :steps="[...]" />
```

With an anchor `A`, the derivation shows step 0 from click `A` and morphs at `A+1, A+2, ...`. Without an anchor, slots are relative and sequence from the slide's running click offset. Only a numeric `v-click` value is detected; `v-click` with no value does not set an anchor. `at` takes precedence over `v-click`.

Rendered outside a slide (no click context), the component falls back to its own counter: each click on the component advances one step.

## Styling hooks

Root element: `.gov-derivation`, with modifier classes `gov-derivation--md|lg|xl`, `--hist-top|bottom|left|right`, `--boxed`, `--annotated` (when annotations are configured) and `--gutter` (while callouts are shown).

CSS custom properties:

| Variable | Default | Set by | Meaning |
|---|---|---|---|
| `--gd-size` | `1.8rem` (`1.35rem` md, `2.4rem` xl) | size class | Equation font size. |
| `--gd-dur` | `700ms` | inline style from `duration` | Morph duration (also glide of the focus box, collapse of the equation area). |
| `--gd-exit-dur` | `140ms` | inline style, `duration * 0.2` | Fade-out of removed tokens. |
| `--gd-hist-scale` | `0.58` | inline, only when `historySize` is a number | Ledger font size as a multiple of `--gd-size`. |
| `--gd-hist-size` | unset | inline, only when `historySize` is a string | Ledger font size as a CSS length; wins over scale. |
| `--gd-hist-opacity` | `1` | inline, only when `historyOpacity` is set | Ledger line opacity. |
| `--gd-annotation-gutter` | `13rem` | `.gov-derivation--annotated` | Right padding reserved for callouts. |
| `--gd-annotation-width` | `12rem` | `.gov-derivation--annotated` | Callout box width. |

Because the size class and annotation variables are set on the same element as `.gov-derivation`, set them from a rule with higher specificity (a plain wrapper variable would be overridden), for example:

```html
<style>
.my-slide .gov-derivation { --gd-size: 2.1rem; --gd-annotation-gutter: 16rem; --gd-annotation-width: 15rem; }
</style>
```

For `duration`, `historySize` and `historyOpacity`, use the props rather than CSS, since the component writes them inline.

Useful classes: `.gd-equation` (current equation), `.gd-tok` (a morphing token, with `.gd-tok--bin|rel|punct|op|open|close|ord` role classes), `.gd-note`, `.gd-history`, `.gd-hist-line`, `.gd-hist-eq`, `.gd-hist-note`, `.gd-hist-tag`, `.gd-hist-section`, `.gd-focus-box`, `.gd-box` (the CSS-drawn `\boxed`), `.gd-matrix`, `.gd-annotation`, `.gd-annotation-box`, `.gd-progress` / `.gd-dot` (`--on`, `--done`). The ledger ink is `var(--steel)`; to show it in full ink, set `.gd-hist-line { color: var(--navy); }` (`historyOpacity` only multiplies over that colour). Entering tokens flash `var(--crimson)`; section headings and the equation use `var(--navy)`.

## Writing LaTeX that morphs well

Each step is tokenised into units that are rendered separately by KaTeX and matched by source text.

What is recognised as one token:

- A single character or command (`x`, `\alpha`, `+`, `=`), together with its attached `^`/`_` scripts (`x^{2}`, `\theta_{t_k}`).
- A command with its arguments: `\frac`, `\dfrac`, `\tfrac`, `\binom`, `\genfrac`, `\overset`, `\underset` (two arguments), `\sqrt[n]{...}`, and one-argument commands such as `\mathbf`, `\mathbb`, `\mathcal`, `\mathrm`, `\bm`, `\hat`, `\widehat`, `\bar`, `\overline`, `\vec`, `\dot`, `\tilde`, `\text`, `\operatorname`, `\underbrace`, `\overbrace`, `\substack`, `\mathbin`/`\mathrel`/...
- Big operators with limits: `\sum_{i}^{n}`, `\prod`, `\int`, `\lim`, `\max`, ... (limits in either order).
- `\left`/`\right` with their delimiter.
- A `{...}` brace group.
- Matrix-like environments `matrix`, `bmatrix`, `pmatrix`, `Bmatrix`, `vmatrix`, `Vmatrix`, `cases`, `dcases`: split one level deep into two bracket pieces plus one token per non-empty cell, so entries match across steps and move in a CSS grid.
- `\boxed{...}` and `\fbox{...}`: the box is drawn with CSS around the body, whose tokens stay separately matchable (so the boxed result morphs from the line before instead of swapping wholesale).

Tips:

- Keep shared pieces spelled identically between steps. `x^2` and `x^{2}` normalise the same in `morphMap` lookups, but tokens in the main matching compare literal source text, so be consistent.
- A scripted symbol is one token: `\mathbf{x}_t` is a single unit, `\mathbf{x}` then `_t` is not. Changing a subscript makes the whole token new (fade out and in) unless you map it with `morphMap`.
- Put shared structure in the same order in consecutive steps; contiguous runs glide as rigid chunks.
- Use `\underbrace{...}_{...}` to label a part: the core keeps its identity and morphs.
- Use `histTex`/`history: false` for tall steps; use `\\` to wrap long lines.
- Spacing after bin/rel/punct/op tokens is reproduced with CSS margins. Rare commands outside the built-in lists default to the plain `ord` class, so spacing around them can look slightly different from a one-piece KaTeX render. Add explicit `\,`/`\;` if needed.

Limits:

- Environments that are not rows x cells (`aligned`, `array`, `align`, ...) are one opaque token: they morph only as a whole.
- A matrix cell that contains more than one atom, or a nested environment, is one opaque token.
- A cell that is empty emits no token.
- A top-level `\\` inside a `\boxed{}` body is drawn as a real break inside the box.
- `\tag` must be written without nested braces and is stripped from the equation.
- Rendering is via KaTeX with `throwOnError: false` and `strict: false`: unsupported commands render as KaTeX's error span (red source) rather than throwing, and a failed whole-line render falls back to escaped source. Only commands KaTeX supports can be used.
- Note text is not LaTeX: only `$...$` spans are math.

## Behaviour in print/PDF export and presenter mode

- Click progression is the slide's own counter, so presenter view, overview and the audience window stay in sync, and a back-navigation morphs back to the previous step.
- The step shown is the counter clamped to `[0, steps.length - 1]`. Static exports (print/PDF) render the slide at its final click state: the large equation shows the final step and the ledger lists every ledger-eligible step before it. Ending on an empty step therefore gives an export with the full ledger and no equation.
- In `@media print` the transitions on tokens, notes, ledger and callouts are disabled, and the morph ghost layer is hidden. `prefers-reduced-motion` also disables the animated transitions.
- Callouts are placed by a timer (`2 * duration + 60` ms after the last step) followed by measurement. For exports, if your exporter captures a page sooner than that, callouts may be missing; this is not specially handled in the code, so check an export of any annotated slide.
- With no click context at all (component rendered outside a slide), clicking the component advances it.
- Progress dots and the ledger are `aria-hidden`; the equation carries `aria-label` with the step's tex.

## Troubleshooting

- **Backslashes vanish or TeX looks wrong.** Inside `:steps="[...]"` in Slidev Markdown, write `'\\frac{a}{b}'`, `'\\mathbf{A}'`, and `'\\\\'` for a TeX line break. A single backslash is a JavaScript escape. In a plain (non-bound) attribute such as `history-align="=,\approx"`, the value is literal, so use one backslash there; use two in `:history-align="['=', '\\approx']"`.
- **Arrow key leaves the slide instead of morphing.** Click slots are registered at mount; if the component is rendered inside something that mounts later or in a different context, give it an explicit `at`.
- **Derivation shows as already finished when revealed with `v-click`.** Relative slots resolve from the running click offset; pin the start with `v-click="N"` (numeric) or `:at="N"`.
- **Symbol fades out and back in instead of moving.** The token's source changed (`x_t` to `x_{t+1}`, `A` to `A_r`). Use `morphMap`, or keep the token text identical.
- **A step contains single quotes or HTML characters.** The `:steps` value is a JS expression inside an HTML attribute: use double quotes outside and single quotes inside, and escape an inner single quote as `\'`; avoid raw `"` inside the string.
- **Quotes/`$` in notes.** `$...$` is math; write `\$` for a literal dollar sign. An odd number of `$` leaves the last one literal.
- **Ledger line missing.** The step has `history: false`, or it is the current step (the current step enters the ledger when you click past it).
- **Callout missing.** No step has that `id`/`step`, the anchor is the last step or has `history: false`, `showHistory` is false, or the derivation has not reached its last step.
- **Aligned lines do not align.** The marker is inside braces/an environment, or is spelled differently from the source (`\approx` vs `\simeq`), or the line has none of the markers.
- **`historyOrder` seems ignored.** A step sets `histIndex`/`histAt`/`historyAt`, which takes over ordering.
- **Wrong size from your CSS.** The size class is on the root element; use a more specific selector (see [Styling hooks](#styling-hooks)).
- **Matrix is too tall for the ledger.** Use `history: false` or give a compact `histTex`.
