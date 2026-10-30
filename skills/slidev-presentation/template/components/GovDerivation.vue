<script setup lang="ts">
// GovDerivation — animated equation transformations, 3Blue1Brown-style.
//
// Each step is LaTeX. On every click (or arrow-key advance) the equation
// morphs to the next step: tokens that survive fly to their new position,
// new tokens fade in (briefly crimson), removed tokens drift away. Like
// Manim's TransformMatchingTex, but in the browser.
//
// The derivation rides the slide's click counter — one morph per click, and
// it rests on the last step. It registers its own click slots on the slide's
// clicks context at mount (one per morph), so an arrow-key advance morphs
// the derivation instead of navigating away; slides without it work unchanged.
// Steps the derivation has passed are written below the equation as a small
// ledger (showHistory, default on) so latecomers can follow; exports show it
// in full. Static exports (print) show the final step.
//
// Usage:
//   <GovDerivation :steps="['ax^2 + bx + c = 0', 'x^2 + \\frac{b}{a}x = -\\frac{c}{a}']" />
//   <GovDerivation :steps="[{ tex: 'E = mc^2', note: 'mass–energy equivalence' }]" />
//   // notes take plain text + inline math: `$…$` spans render via KaTeX,
//   // `<strong>`/`<em>` carry through as emphasis, `<br>`/newline breaks
//   <GovDerivation :steps="[{ tex: '\\mathbf{A}x = b', note: 'Apply $\\mathbf{A}^{-1}$ on both sides' }]" />
//   // a top-level `\\` in `tex` wraps the equation onto centered lines
//   // (multi-line step); `\\` inside braces/ environments doesn't cut
//   <GovDerivation :steps="[{ tex: 'x=y \\\\ \\\\Rightarrow \\\\ z=2y' }]" />
//   // a step can opt out of the ledger — e.g. a tall matrix line:
//   <GovDerivation :steps="[{ tex: '\\mathbf{X} = …', history: false }]" />
//   // …or keep the equation but give its ledger line its own tex/note:
//   <GovDerivation :steps="[{ tex: '\\mathbf{X} = \\begin{bmatrix} …', note: 'full matrix', histTex: '\\mathbf{X}', histNote: 'snapshots' }]" />
//   // align ledger lines at a marker, like LaTeX's align: all lines that
//   // opt in share their left/marker/right columns (marker '&' renders nothing)
//   <GovDerivation :steps="[
//     { tex: 'x + y = 3', histAlign: '=' },
//     { tex: '2x + 3y = 12', histAlign: '=' },
//   ]" />
//   <GovDerivation :steps="…" history-align="=" />
//   // several relations can share one alignment: give a list (or a
//   // comma-separated string) — each line splits at the leftmost marker it
//   // carries, so `=`-lines and `\approx`-lines line up on the same column
//   <GovDerivation :steps="…" history-align="=,\approx" />
//   <GovDerivation :steps="…" :history-align="['=', '\\approx']" />
//   // label phases of the derivation: a step may declare `section: '…'`; the
//   // ledger groups every step naming the same label under one heading, in
//   // order of first appearance. The heading (and the step's own line) only
//   // appear once the derivation has passed the declaring step — a phase is
//   // never announced while its first equation is still on stage
//   <GovDerivation :steps="[
//     { tex: 'x = …', section: 'Set-up' },
//     { tex: 'y = …' },
//     { tex: 'z = …', section: 'Reduce' },
//   ]" />
//   // place the ledger above/below or beside the equation (default 'top')
//   <GovDerivation :steps="…" history-position="right" />
//   // pin a line's ledger position: when the step completes, its line is
//   // inserted at that 0-based ledger index — counted from the OLDEST line
//   // (the ledger's first row) toward the newest — instead of appended;
//   // clamped to the current depth, later lines shift down animatedly
//   <GovDerivation :steps="[
//     { tex: '\\mathbf{A} = …', histIndex: 0 },   // land at the ledger's top
//     { tex: '… \\tag{3}', histIndex: 3 },        // land at slot 3
//   ]" />
//   // draw a focus box around the current equation
//   <GovDerivation :steps="…" boxed />
//   // number an equation with \tag{n}; the label shows in the ledger
//   <GovDerivation :steps="[{ tex: 'E = mc^2 \\tag{1}', note: 'see (1)' }]" />
//   <GovDerivation :steps="…" :history-size="0.7" :history-opacity="0.55" />
//   // callouts that appear once the derivation finishes, each anchored to the
//   // ledger line of the step it explains (step index into `steps`, or the
//   // step's own `id` — stable when steps are inserted or reordered)
//   <GovDerivation :steps="[
//     { tex: 'E = mc^2', id: 'einstein' }
//   ]" :annotations="[
//     { id: 'einstein', text: 'mass–energy equivalence' },
//   ]" />

import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import type { ClicksContext } from '@slidev/types'
import { collectToks, renderNote, renderStep, renderTex, type TokClass } from './latex'

interface DerivationStep {
  tex: string
  /** note shown under the equation; `$…$` spans inside render as inline
   *  math, `<strong>`/`<em>` as emphasis, `<br>`/newline breaks the line */
  note?: string
  /** equation number shown to the right; `\tag{…}` in `tex` sets it too */
  tag?: string | number
  /** set false to keep this step out of the history ledger (default true) */
  history?: boolean
  /** ledger slot: when this step completes, its line is INSERTED at this
   *  0-based index of the history stack — counted from the OLDEST line (the
   *  ledger's first/reading-order row) counting toward the newest — instead
   *  of appended after the previous lines; later lines shift down. Clamped
   *  to the current depth. Unset keeps derivation order (append). */
  histIndex?: number
  /** aliases of `histIndex` */
  histAt?: number
  historyAt?: number
  /** LaTeX shown for this step in the history ledger instead of `tex` —
   *  e.g. a compact form when the full equation is too tall */
  histTex?: string
  /** note shown for this step in the history ledger instead of `note` */
  histNote?: string
  /** alias of `histTex` */
  historyTex?: string
  /** alias of `histNote` */
  historyNote?: string
  /** align this step's history line at a marker (`'='`, `'&'`, …), like
   *  LaTeX's align: the marker splits the line into right-aligned left /
   *  centered marker / left-aligned right columns shared by every aligned
   *  line. A list (or comma-separated string) names several acceptable
   *  markers; the line splits at the leftmost one it contains. `false` opts
   *  this line out of the component's `historyAlign` */
  histAlign?: string | string[] | false
  /** alias of `histAlign` */
  historyAlign?: string | string[] | false
  /** alias of `histAlign` */
  align?: string | string[] | false
  /** label of the derivation phase this step belongs to: the ledger groups
   *  every step naming the same label under one heading, in order of the
   *  section's first appearance (a later step declaring an earlier
   *  section's label joins the existing block instead of opening a second
   *  one). Steps without a section fall under the most recently declared
   *  one — where "most recently" follows ledger position, not derivation
   *  order (`histIndex` insertions land out of step sequence). The heading
   *  appears when the section's first line enters the ledger, never while
   *  that line is still the current equation. */
  section?: string
}

interface DerivationAnnotation {
  /** index of the step whose ledger line the callout points at — or anchor
   *  by `id`/`stepId` (see below) instead; an annotation with neither is ignored */
  step?: number
  /** callout text; `$…$` spans render as inline math */
  text: string
  /** alternatively, the `id` of the step to anchor to — steps can declare
   *  `id: '…'` so callouts stay stable when steps are inserted or reordered */
  id?: string
  /** alias of `id` */
  stepId?: string
}

const props = withDefaults(defineProps<{
  /** derivation steps — LaTeX source, or { tex, note } (note renders under
   *  the equation; `$…$` spans inside the note render as inline math) */
  steps: (string | DerivationStep)[]
  /** morph duration in ms */
  duration?: number
  size?: 'md' | 'lg' | 'xl'
  /** progress dots under the equation */
  showProgress?: boolean
  /** write completed steps as a ledger, so the audience can catch up */
  showHistory?: boolean
  /** where the history ledger renders relative to the equation */
  historyPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** draw a focus box around the current equation */
  boxed?: boolean
  /** default marker(s) at which to align ledger lines (e.g. `'='`), like
   *  LaTeX's align. A list (or comma-separated string) lets lines carrying
   *  different relations — `'='` and `'\\approx'` — share one alignment,
   *  each splitting at the leftmost marker it contains. Unset keeps every
   *  line individually centered. Per-step `histAlign` overrides it, and
   *  `false` opts a line out. */
  historyAlign?: string | string[]
  /** token tex → canonical identity: tokens sharing an id morph into each
   *  other (in order of appearance) instead of fading out and flashing in.
   *  Identity follows decoration: `\underbrace{\mathbf{x}_t}_\text{…}` is
   *  still `\mathbf{x}_t` (so it matches automatically), and the map only
   *  needs to declare renames like `\mathbf{x}_t` → `\mathbf{x}_1` */
  morphMap?: Record<string, string>
  /** font size of the stacked history lines — number = em multiplier of the
   *  equation size (default 0.58), string = raw CSS length (e.g. '1.1rem') */
  historySize?: string | number
  /** opacity of the stacked history lines (default 1; the ink is already muted) */
  historyOpacity?: number
  /** ledger line order: 'oldest-first' (default) stacks lines in derivation
   *  order, so each new line lands directly against the current equation;
   *  'newest-first' stacks with the newest line at the top of the ledger —
   *  each new line lands at the far end and older lines slide toward the
   *  equation instead */
  historyOrder?: 'oldest-first' | 'newest-first'
  /** callouts that appear with the finished derivation, each pointing at the
   *  ledger line of the step it explains */
  annotations?: DerivationAnnotation[]
  /** absolute click at which this derivation starts (overrides the
   *  component's own v-click anchor): it reveals showing step 0 and morphs
   *  at `at + 1, at + 2, …`. Without an anchor the morph slots are relative
   *  and sequence from the slide's running click offset as before. */
  at?: number
}>(), {
  duration: 700,
  size: 'lg',
  showProgress: true,
  showHistory: true,
  historyPosition: 'top',
})

/* root styling vars — historySize/historyOpacity only bind when set, so the
   CSS defaults (0.58 of the equation size, full opacity) stay in charge.
   Removed tokens fade out on a fast clock of their own (--gd-exit-dur):
   they only need to get out of the way, not keep pace with the survivors. */
const EXIT_SCALE = 0.2
const exitDur = computed(() => Math.round(props.duration * EXIT_SCALE))
const rootStyle = computed(() => {
  const style: Record<string, string> = {
    '--gd-dur': `${props.duration}ms`,
    '--gd-exit-dur': `${exitDur.value}ms`,
  }
  if (typeof props.historySize === 'number') style['--gd-hist-scale'] = String(props.historySize)
  else if (typeof props.historySize === 'string') style['--gd-hist-size'] = props.historySize
  if (props.historyOpacity !== undefined) style['--gd-hist-opacity'] = String(props.historyOpacity)
  return style
})

/* `\tag{n}` is pulled out of the step before tokenizing: rendering it inside
   the token stream would split `\tag` from its argument. It becomes a label
   beside the equation (and in the ledger) instead. */
const TAG_RE = /\\tag\*?\{([^{}]*)\}/
const steps = computed<DerivationStep[]>(() =>
  props.steps.map((s) => {
    const step = typeof s === 'string' ? { tex: s } : { ...s }
    const stripTag = (tex: string): string => {
      const m = TAG_RE.exec(tex)
      if (!m) return tex
      if (step.tag === undefined) step.tag = m[1]
      return `${tex.slice(0, m.index)}${tex.slice(m.index + m[0].length)}`.trim()
    }
    step.tex = stripTag(step.tex)
    if (step.histTex) step.histTex = stripTag(step.histTex)
    if (step.historyTex) step.historyTex = stripTag(step.historyTex)
    return step
  }),
)

/* --- click source: the slide's click counter, or a local fallback ------ */
let navClicks: { value: number } | null = null
let clicksCtx: ClicksContext | null = null
try {
  const ctx = useSlideContext()
  navClicks = ctx.$clicks
  clicksCtx = ctx.$clicksContext
} catch {
  navClicks = null // rendered outside a slide — fall back to clicks on the component
}
const localClicks = ref(0)
function onRootClick() {
  if (!navClicks) localClicks.value++
}

/* --- anchor: absolute start click ------------------------------------- */
/* Same pattern as GovChain: when the usage pins the component to an absolute
   click (<GovDerivation v-click="8">), the morph slots must be pinned to
   that anchor too — relative '+1' slots would resolve from the slide's
   running offset, land before the reveal, and the derivation would appear
   already finished. With an anchor A the derivation reveals at A (step 0)
   and morphs at A+1 … A+steps; stepIndex maps the raw counter back to 0.
   `at` overrides the anchor explicitly for wrapper-based usages. */
const anchor = computed<number | null>(() => {
  if (props.at != null) return props.at
  const dirs = (getCurrentInstance()?.vnode as any)?.dirs
  if (Array.isArray(dirs)) {
    for (const d of dirs) {
      const isClick = d?.dir?.name === 'v-click' || d?.name === 'click'
      if (isClick && typeof d.value === 'number') return d.value
    }
  }
  return null
})

/* --- click budget: register one slot per morph ------------------------ */
/* The slide's click counter only advances through slots registered on the
   slide's clicks context — v-click elements do this from their directive.
   Without slots the first arrow press would navigate straight to the next
   slide and the derivation would never morph. Slots are registered at mount
   so DOM order is respected: v-click elements placed before the component
   keep the earlier clicks, ones placed after the component come later.
   The budget is kept in sync with the steps: editing the deck live (HMR)
   keeps the mounted instance, so a steps array that grew or shrank would
   otherwise leave the derivation with too few slots (last steps unreachable,
   arrow skips to the next slide) or too many (arrow presses do nothing). */
let slotSeq = 0
const morphSlots: string[] = []
function syncMorphSlots() {
  if (!clicksCtx) return
  const needed = Math.max(0, steps.value.length - 1)
  while (morphSlots.length < needed) {
    const info = clicksCtx.calculate(
      anchor.value == null ? '+1' : anchor.value + 1 + morphSlots.length,
    )
    if (!info) break
    const slot = `gd-morph-${slotSeq++}`
    clicksCtx.register(slot, info)
    morphSlots.push(slot)
  }
  while (morphSlots.length > needed) {
    clicksCtx.unregister(morphSlots.pop()!)
  }
}
function unregisterMorphSlots() {
  if (!clicksCtx) return
  for (const el of morphSlots) clicksCtx.unregister(el)
}
onMounted(syncMorphSlots)
watch(() => steps.value.length, syncMorphSlots)

onUnmounted(unregisterMorphSlots)

const stepIndex = computed(() => {
  const max = Math.max(0, steps.value.length - 1)
  const raw = navClicks ? navClicks.value : localClicks.value
  const c = anchor.value == null ? raw : raw - anchor.value
  return Math.min(Math.max(c, 0), max)
})
const currentStep = computed(() => steps.value[stepIndex.value] ?? { tex: '' })
const currentEmpty = computed(() => !currentStep.value.tex.trim())
const tokens = computed<RNode[]>(() => renderStep(currentStep.value.tex, canonTok))
const currentNote = computed(() => currentStep.value.note ?? '')

/* notes support inline math (`Apply $\mathbf{X}^\dagger$ on both sides`) —
   rendered once per distinct note text and cached */
const noteCache = new Map<string, string>()
function noteHtml(note: string): string {
  let h = noteCache.get(note)
  if (h === undefined) {
    h = renderNote(note)
    noteCache.set(note, h)
  }
  return h
}
const currentNoteHtml = computed(() => (currentNote.value ? noteHtml(currentNote.value) : ''))

/** column count for an env body's grid — every cell knows its matrix's
 *  rows/cols, so the first cell is authoritative (empty cells emit no token
 *  but their share of the grid placement is explicit per cell) */
function envGridStyle(cells: RenderedTok[]): Record<string, string> {
  const cols = cells[0]?.cell?.cols ?? 1
  return { gridTemplateColumns: `repeat(${cols}, max-content)` }
}

/** canonical identity of a token tex: morphMap override, else the tex itself.
 *  Lookups tolerate script-brace variation: `x_2`/`x_{2}` and
 *  `_\text{state}`/`_{\text{state}}` both normalize the same, so map keys
 *  can be written the natural way. */
const normScript = (s: string) =>
  s
    .replace(/([_^])\{([a-zA-Z0-9*+\-])\}/g, '$1$2')
    .replace(/([_^])\{(\\[a-zA-Z]+(?:\{[^{}]*\})?)\}/g, '$1$2')
/** the element inside a decoration — `\underbrace{\mathbf{x}_t}_\text{Current
 *  state}` is still `\mathbf{x}_t`: the brace is an annotation, not a new
 *  element, so the decorated token keeps the core's identity and morphs. */
function decorationCore(tex: string): string | null {
  const m = /^\\(?:under|over)brace\{/.exec(tex)
  if (!m) return null
  let depth = 0
  for (let i = m[0].length - 1; i < tex.length; i++) {
    const c = tex[i]
    if (c === '\\') {
      i++ // skip the escaped char — harmless for brace depth
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return tex.slice(m[0].length, i)
    }
  }
  return null // unbalanced — leave the tex as-is
}
function canonTok(tex: string): string {
  const map = props.morphMap
  if (map) {
    const v = map[tex] ?? map[normScript(tex)]
    if (v !== undefined) return normScript(v)
  }
  const core = decorationCore(tex)
  if (core !== null) return canonTok(core)
  return normScript(tex)
}

/** canonical ids a morphMap entry declares — authorial identity, which the
 *  alignment must honour over mere travel-distance tie-breaks (X → X† must
 *  morph even when letting A stay put would travel less) */
const mappedBases = computed(() => new Set(Object.values(props.morphMap ?? {}).map(v => normScript(v))))

/* --- history ledger ---------------------------------------------------- */
/* Every step the derivation has passed is written as a ledger — above,
   below, or beside the equation (historyPosition), small, with its note —
   so anyone who missed a morph can still follow.
   Steps with `history: false` are omitted (useful for a tall matrix line
   that would bloat the ledger). Rendered once per tex and cached. In print
   the ledger lists every step except the last (the big equation shows the
   final step). */
const histCache = new Map<string, string>()
const historyHtml = computed<Record<number, string>>(() => {
  const m: Record<number, string> = {}
  for (let i = 0; i < steps.value.length; i++) {
    const tex = steps.value[i]!.histTex ?? steps.value[i]!.historyTex ?? steps.value[i]!.tex
    if (!histCache.has(tex)) histCache.set(tex, renderTex(tex))
    m[i] = histCache.get(tex)!
  }
  return m
})
const historyNote = (step: DerivationStep | undefined) =>
  step?.histNote ?? step?.historyNote ?? step?.note

/* --- aligned ledger lines --------------------------------------------- */
/* A step can name marker(s) (`histAlign`/`align`, or the component-wide
   `historyAlign`) at which its ledger line should align with the others,
   like LaTeX's align. One or several markers may be given (a list, or a
   comma-separated string — e.g. `=,\approx`); the line splits at the
   leftmost top-level occurrence among them, into left / marker / right
   pieces. Braces and nested environments are skipped, so `=` inside
   `\text{…}` or a matrix cell can't become the split point. Marker `&` is
   an invisible split (the classic align ampersand); any other marker is
   rendered as its own column. */
function ledgerMarkers(step: DerivationStep | undefined): string[] | null {
  const m = step?.histAlign ?? step?.historyAlign ?? step?.align ?? props.historyAlign
  if (m === false || m == null) return null
  const list = (Array.isArray(m) ? m : m.split(','))
    .map(s => s.trim())
    .filter(s => s.length)
  return list.length ? list : null
}

function findTopLevel(tex: string, marker: string): number {
  let braces = 0
  let envs = 0
  let i = 0
  const n = tex.length
  while (i < n) {
    if (!braces && !envs && tex.startsWith(marker, i)) return i
    const c = tex[i]!
    if (c === '\\') {
      let j = i + 1
      while (j < n && /[a-zA-Z]/.test(tex[j]!)) j++
      const cmd = tex.slice(i + 1, j)
      if (cmd === 'begin') envs++
      else if (cmd === 'end') envs = Math.max(0, envs - 1)
      i = j === i + 1 ? i + 2 : j
      continue
    }
    if (c === '{') braces++
    else if (c === '}') braces--
    i++
  }
  return -1
}

interface HistoryParts {
  left: string
  mark: string
  right: string
}
const partCache = new Map<string, HistoryParts | null>()
const historyParts = computed<Record<number, HistoryParts | null>>(() => {
  const m: Record<number, HistoryParts | null> = {}
  for (let i = 0; i < steps.value.length; i++) {
    const markers = ledgerMarkers(steps.value[i])
    if (!markers) {
      m[i] = null
      continue
    }
    const tex = steps.value[i]!.histTex ?? steps.value[i]!.historyTex ?? steps.value[i]!.tex
    const key = `${markers.join('\u0001')}\u0000${tex}`
    if (!partCache.has(key)) {
      // split at the leftmost marker the line carries (ties keep list order)
      const hits = markers
        .map(mk => ({ mk, at: findTopLevel(tex, mk) }))
        .filter(h => h.at >= 0)
        .sort((a, b) => a.at - b.at)
      if (!hits.length) {
        partCache.set(key, null) // no marker present — leave the line centered
      } else {
        const { mk, at } = hits[0]!
        partCache.set(key, {
          left: renderTex(tex.slice(0, at)),
          mark: mk === '&' ? '' : renderTex(mk),
          right: renderTex(tex.slice(at + mk.length)),
        })
      }
    }
    m[i] = partCache.get(key)!
  }
  return m
})

const stepLedgerSlot = (i: number): number | null => {
  const s = steps.value[i]
  const at = s?.histIndex ?? s?.histAt ?? s?.historyAt
  return typeof at === 'number' ? at : null
}

const visited = computed(() => {
  const raw: number[] = []
  for (let i = 0; i < stepIndex.value; i++) {
    const s = steps.value[i]!
    // A step enters the ledger only after the derivation has passed it —
    // section declarations included, so a phase heading never shows while
    // the section's first equation is still the one on stage (it would
    // read as the equation duplicated below itself). `history: false`
    // skips a line entirely (see ledgerRows for grouping).
    if (s.history !== false) raw.push(i)
  }
  // any step naming an explicit slot? insert at landing time — each line goes
  // to its `histAt` position (clamped to the current depth), unnumbered lines
  // append after the previous ones, and later insertions push lines down
  if (raw.some(i => stepLedgerSlot(i) != null)) {
    const out: number[] = []
    for (const i of raw) {
      const at = stepLedgerSlot(i)
      if (at != null && at < out.length) out.splice(Math.max(0, at), 0, i)
      else out.push(i)
    }
    return out
  }
  // newest-first flips the stack: the fresh line enters at the ledger's far
  // end and older lines slide toward the equation (keyed TransitionGroup
  // moves keep the flip animated)
  return props.historyOrder === 'newest-first' ? raw.reverse() : raw
})
/* the ledger only switches to the shared alignment grid when a visible line
   actually opts in */
const historyAligned = computed(() => visited.value.some(i => historyParts.value[i]))

/* --- ledger sections --------------------------------------------------- */
/* A step may declare `section: '…'`: the ledger groups its lines under a
   shared heading — every step naming the same label joins the same block,
   wherever it falls in the derivation, and blocks render in order of the
   section's first appearance. Steps without a section fall under the most
   recently declared one (before any, under an unheaded block). Headings
   are keyed by label, lines by step index, so `histIndex` insertions and
   regrouping both move things animatedly. */
type LedgerRow =
  | { kind: 'section'; key: string; label: string }
  | { kind: 'step'; key: number; i: number }
const ledgerRows = computed<LedgerRow[]>(() => {
  const blocks = new Map<string, number[]>()
  const order: string[] = []
  let cur = ''
  for (const i of visited.value) {
    // a line joins the block of the most recently declared section in LEDGER
    // order, not derivation order: `histIndex` insertions land out of step
    // sequence, so an undeclared line groups with the lines it lands among
    const declared = steps.value[i]!.section
    if (declared !== undefined) cur = declared
    if (!blocks.has(cur)) {
      blocks.set(cur, [])
      order.push(cur)
    }
    blocks.get(cur)!.push(i)
  }
  const rows: LedgerRow[] = []
  for (const sec of order) {
    if (sec) rows.push({ kind: 'section', key: `sec-${sec}`, label: sec })
    for (const i of blocks.get(sec)!) rows.push({ kind: 'step', key: i, i })
  }
  return rows
})
/* rendered oldest line first — on top the newest completed step lands
   directly against the current formula; on a side it stacks downward */

/* --- end-of-derivation annotations ------------------------------------ */
/* Callouts that appear with the finished derivation, each pointing at the
   ledger line of the step it explains. The ledger reserves a right-hand
   gutter (--gd-annotation-gutter); a callout's dot sits just clear of the
   ledger (past any equation tag) while the box may be nudged up or down so
   boxes never overlap, and an elbow leader (vertical then horizontal) joins
   the two. Positions are local px, corrected for Slidev's CSS scale of the
   slide. */
const ANNOTATION_DOT_GAP = 10 // local px between the ledger edge and the dot
interface PlacedAnnotation extends DerivationAnnotation {
  key: string
  n: number
  /** vertical centre of the box, local px */
  boxTop: number
  /** vertical centre of the ledger row, local px */
  dotTop: number
  /** horizontal position of the dot, local px (just past the ledger edge) */
  dotX: number
  /** elbow leader from the dot to the box's left edge */
  path: string
}
const rootRef = ref<HTMLElement | null>(null)
const placedAnnotations = ref<PlacedAnnotation[]>([])
const annotationsVisible = computed(
  () => (props.annotations?.length ?? 0) > 0 && stepIndex.value >= steps.value.length - 1,
)
const annotationsSettled = ref(false)
const annotationsReady = ref(false)
const boxEls = new Map<number, HTMLElement>()
let annotationRO: ResizeObserver | null = null
let annotationTimer: ReturnType<typeof setTimeout> | null = null
let annotationGen = 0

function setBoxRef(i: number, el: unknown) {
  if (el instanceof HTMLElement) boxEls.set(i, el)
  else boxEls.delete(i)
}

/** Separate boxes that would overlap, keeping them as close to their anchor
 *  rows as possible: relax overlapping neighbours apart until none overlap,
 *  then clamp to the stage and re-establish order. */
function resolveAnnotationTops(
  desired: number[],
  heights: number[],
  gap: number,
  lo: number,
  hi: number,
): number[] {
  const order = desired.map((_, i) => i).sort((a, b) => desired[a]! - desired[b]!)
  const centers = order.map(i => desired[i]!)
  const hs = order.map(i => heights[i]!)
  for (let iter = 0; iter < 100; iter++) {
    let moved = false
    for (let j = 0; j < order.length - 1; j++) {
      const minDist = (hs[j]! + hs[j + 1]!) / 2 + gap
      const dist = centers[j + 1]! - centers[j]!
      if (dist < minDist) {
        const push = (minDist - dist) / 2
        centers[j] = centers[j]! - push
        centers[j + 1] = centers[j + 1]! + push
        moved = true
      }
    }
    if (!moved) break
  }
  for (let j = 0; j < order.length; j++) {
    const half = hs[j]! / 2
    centers[j] = Math.max(lo + half, Math.min(hi - half, centers[j]!))
  }
  for (let j = 1; j < order.length; j++) {
    const minDist = (hs[j - 1]! + hs[j]!) / 2 + gap
    centers[j] = Math.max(centers[j]!, centers[j - 1]! + minDist)
  }
  for (let j = order.length - 2; j >= 0; j--) {
    const minDist = (hs[j]! + hs[j + 1]!) / 2 + gap
    centers[j] = Math.min(centers[j]!, centers[j + 1]! - minDist)
  }
  const out: number[] = []
  order.forEach((idx, j) => { out[idx] = centers[j]! })
  return out
}

function leaderPath(dotX: number, dotTop: number, boxLeft: number, boxTop: number): string {
  // elbow: drop from the dot to the box's centre line, then run horizontally
  return `M ${dotX} ${dotTop} L ${dotX} ${boxTop} L ${boxLeft} ${boxTop}`
}

async function updateAnnotations() {
  const root = rootRef.value
  const config = props.annotations
  if (!root || !config?.length || !annotationsVisible.value || !annotationsSettled.value) {
    placedAnnotations.value = []
    annotationsReady.value = false
    return
  }
  const gen = ++annotationGen
  const rootRect = root.getBoundingClientRect()
  const scale = rootRect.width / root.offsetWidth || 1
  const rootW = root.offsetWidth
  const rootH = root.offsetHeight
  const lineEls = Array.from(root.querySelectorAll<HTMLElement>('.gd-history .gd-hist-line'))
  const byStep = new Map<number, HTMLElement>()
  // the DOM order is the grouped ledger order, not raw derivation order —
  // zip the step indices out of the rendered rows against the line elements
  ledgerRows.value
    .filter(r => r.kind === 'step')
    .map(r => (r.kind === 'step' ? r.i : -1))
    .forEach((step, i) => {
      const el = lineEls[i]
      if (el) byStep.set(step, el)
    })
  /** index of the step an annotation anchors to: `id`/`stepId` looks the step
   *  up by its declared `id` (null when no step carries it), else the
   *  positional `step` index; null when neither is given */
  const annotationStepIndex = (a: DerivationAnnotation): number | null => {
    const ref = a.stepId ?? a.id
    if (ref !== undefined && ref !== null && ref !== '') {
      const i = steps.value.findIndex(s => s.id === ref)
      return i === -1 ? null : i
    }
    return typeof a.step === 'number' ? a.step : null
  }

  const base = config
    .map((a, i) => ({ ...a, step: annotationStepIndex(a) ?? -1, n: i + 1 }))
    .filter(a => a.step >= 0 && byStep.has(a.step))
    .map((a) => {
      const rect = byStep.get(a.step)!.getBoundingClientRect()
      return {
        ...a,
        key: `${a.step}-${a.text}`,
        dotTop: (rect.top + rect.height / 2 - rootRect.top) / scale,
        dotX: (rect.right - rootRect.left) / scale + ANNOTATION_DOT_GAP,
      }
    })

  // first pass: render the boxes at their anchor so their heights can be
  // measured before the collision pass places them (kept invisible meanwhile)
  if (!annotationsReady.value || boxEls.size < base.length) {
    placedAnnotations.value = base.map(b => ({ ...b, boxTop: b.dotTop, path: '' }))
    await nextTick()
    if (gen !== annotationGen) return
  }

  const heights = base.map((_, i) => boxEls.get(i)?.offsetHeight ?? 40)
  const boxWidth = boxEls.get(0)?.offsetWidth ?? 0
  const boxLeft = rootW - boxWidth
  const tops = resolveAnnotationTops(base.map(b => b.dotTop), heights, 6, 0, rootH)
  placedAnnotations.value = base.map((b, i) => {
    const dotX = Math.min(b.dotX, boxLeft - 6)
    return {
      ...b,
      dotX,
      boxTop: tops[i]!,
      path: leaderPath(dotX, b.dotTop, boxLeft, tops[i]!),
    }
  })
  annotationsReady.value = true
}

watch(annotationsVisible, async (on) => {
  if (annotationTimer) clearTimeout(annotationTimer)
  annotationsSettled.value = false
  annotationsReady.value = false
  placedAnnotations.value = []
  if (!on) return
  await nextTick()
  // the empty final step collapses the equation area over one morph
  // duration (the ledger moves up), then the gutter opens over a second
  // morph (the ledger moves left); measure only after both have settled,
  // or the callouts keep pre-move offsets
  annotationTimer = setTimeout(() => {
    annotationsSettled.value = true
    updateAnnotations()
  }, props.duration * 2 + 60)
}, { immediate: true })

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  annotationRO = new ResizeObserver(updateAnnotations)
  if (rootRef.value) {
    annotationRO.observe(rootRef.value)
    const history = rootRef.value.querySelector('.gd-history')
    if (history) annotationRO.observe(history)
  }
})

const stageRef = ref<HTMLElement | null>(null)

/* --- focus box --------------------------------------------------------- */
/* The box is an overlay measured from the current equation, not a border on
   the equation itself: the equation can change width/height every step, and
   a border that jumped to the new size read as jitter. The overlay glides to
   each new rect instead, while the tokens morph inside it. */
const equationRef = ref<HTMLElement | null>(null)
const focusBox = ref({ left: 0, top: 0, width: 0, height: 0 })
const focusReady = ref(false)
const focusBoxStyle = computed(() => ({
  left: `${focusBox.value.left}px`,
  top: `${focusBox.value.top}px`,
  width: `${focusBox.value.width}px`,
  height: `${focusBox.value.height}px`,
}))
function updateFocusBox() {
  const stage = stageRef.value
  const eq = equationRef.value
  if (!props.boxed || !stage || !eq) return
  const sr = stage.getBoundingClientRect()
  const er = eq.getBoundingClientRect()
  if (!sr.width || !er.width) return
  const scale = sr.width / stage.offsetWidth || 1
  focusBox.value = {
    left: (er.left - sr.left) / scale,
    top: (er.top - sr.top) / scale,
    width: er.width / scale,
    height: er.height / scale,
  }
  if (!focusReady.value) requestAnimationFrame(() => { focusReady.value = true })
}
watch(stepIndex, updateFocusBox, { flush: 'post' })
watch(() => props.boxed, (on) => {
  if (!on) focusReady.value = false
  nextTick(updateFocusBox)
}, { flush: 'post' })
let focusRO: ResizeObserver | null = null
onMounted(() => {
  updateFocusBox()
  if (typeof ResizeObserver !== 'undefined') {
    focusRO = new ResizeObserver(updateFocusBox)
    if (stageRef.value) focusRO.observe(stageRef.value)
    if (equationRef.value) focusRO.observe(equationRef.value)
  }
})
onUnmounted(() => {
  focusRO?.disconnect()
  annotationRO?.disconnect()
  if (annotationTimer) clearTimeout(annotationTimer)
})

/* --- morphing ---------------------------------------------------------- */
interface GhostTok {
  key: number
  html: string
  cls: TokClass
  cell: boolean
  left: number
  top: number
  width: number
}
const ghostToks = ref<GhostTok[]>([])
let ghostSeq = 0
let morphGen = 0

watch(stepIndex, async (n, o) => {
  if (n === o || !steps.value.length) return
  const gen = ++morphGen
  const stage = stageRef.value
  if (!stage) return

  // settle any in-flight morph so measurements start from a clean layout —
  // only the animated properties are reset; inline styles owned by Vue
  // (e.g. a cell's grid-row/column) must survive the sweep
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    el.classList.remove('gd-tok--anim')
    el.style.translate = ''
    el.style.opacity = ''
    el.style.color = ''
  })
  ghostToks.value = []

  // measure the outgoing tokens — the DOM still shows step o
  const oldRects = new Map<string, { left: number; top: number; width: number }>()
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    const r = el.getBoundingClientRect()
    oldRects.set(el.dataset.gdId!, { left: r.left, top: r.top, width: r.width })
  })
  const oldNodes = renderStep(steps.value[o].tex, canonTok)
  const newNodes = renderStep(steps.value[n].tex, canonTok)
  const oldToks = collectToks(oldNodes)
  const newToks = collectToks(newNodes)

  await nextTick() // the DOM now shows step n
  if (gen !== morphGen) return

  // the slide may be CSS-scaled (Slidev fits it to the viewport) — measure
  // in viewport px, then convert back to the element's local px
  const stageRect = stage.getBoundingClientRect()
  const scale = stageRect.width / stage.offsetWidth || 1
  type Rect = { left: number; top: number; width: number }

  // invisible tokens (boxed opener/closer render nothing) can't morph or ghost
  const newRects = new Map<string, Rect>()
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    const r = el.getBoundingClientRect()
    newRects.set(el.dataset.gdId!, { left: r.left, top: r.top, width: r.width })
  })
  const oldSeq = oldToks.filter(t => t.html && oldRects.has(t.id))
  const newSeq = newToks.filter(t => t.html && newRects.has(t.id))
  const travel = (a: Rect, b: Rect) =>
    Math.abs(a.left + a.width / 2 - b.left - b.width / 2) + Math.abs(a.top - b.top)
  /* --- which old token does each new token continue? --------------------- */
  /* Two tiers. morphMap-declared tokens are the same object by authorial
     fiat: the k-th old occurrence of a declared base continues as the k-th
     new occurrence — crossing other tokens when the equation rearranges
     (X ≈ A X → X X† ≈ A: X jumps left into X† while ≈ and A shift right).
     Everything else is matched by greedy longest-common-block matching:
     the longest run of tokens that survives contiguously moves as ONE
     rigid chunk — the biggest group possible — instead of a per-token
     alignment tearing it apart. In X = [m] → X' = [m'], X = [m] the whole
     "X = [m]" run glides onto the second copy and the X' copy fades in
     fresh. Blocks may cross other tokens; the remainders on either side
     recurse, so one morph can move several chunks. Equal-length blocks
     tie-break on total token travel. */
  const baseOf = (id: string) => id.replace(/#\d+$/, '')
  const matchNew = new Map<string, Rect>()
  const matchedOld = new Set<number>()
  const oldIdx = new Map(oldSeq.map((t, i) => [t.id, i]))

  // tier 1 — declared identities: occurrence-wise, crossings allowed
  for (const base of mappedBases.value) {
    const olds = oldSeq.filter(t => baseOf(t.id) === base)
    const news = newSeq.filter(t => baseOf(t.id) === base)
    for (let k = 0; k < Math.min(olds.length, news.length); k++) {
      matchNew.set(news[k]!.id, oldRects.get(olds[k]!.id)!)
      matchedOld.add(oldIdx.get(olds[k]!.id)!)
    }
  }

  // tier 2 — everything else: greedy longest-common-block matching. The
  // longest contiguous run shared by old and new is matched token-for-token
  // (so a run identical in both steps keeps its internal layout and glides
  // as one rigid chunk), then the remainders left of it and right of it
  // recurse — several disjoint chunks can form from one morph. A block may
  // cross tokens that tier 1 or another block is crossing the other way.
  const freeOld = oldSeq.filter(t => !mappedBases.value.has(baseOf(t.id)))
  const freeNew = newSeq.filter(t => !mappedBases.value.has(baseOf(t.id)) && !matchNew.has(t.id))
  const matchBlocks = (oLo: number, oHi: number, nLo: number, nHi: number): void => {
    if (oLo >= oHi || nLo >= nHi) return
    let bi = oLo
    let bj = nLo
    let blen = 0
    let btravel = Number.POSITIVE_INFINITY
    for (let i = oLo; i < oHi; i++) {
      for (let j = nLo; j < nHi; j++) {
        if (baseOf(freeOld[i]!.id) !== baseOf(freeNew[j]!.id)) continue
        let len = 1
        while (i + len < oHi && j + len < nHi
          && baseOf(freeOld[i + len]!.id) === baseOf(freeNew[j + len]!.id)) len++
        if (len < blen) continue
        let tr = 0
        for (let k = 0; k < len; k++)
          tr += travel(oldRects.get(freeOld[i + k]!.id)!, newRects.get(freeNew[j + k]!.id)!)
        if (len > blen || tr < btravel) { bi = i; bj = j; blen = len; btravel = tr }
      }
    }
    if (blen === 0) return // nothing shared — the remainders ghost / fade in
    for (let k = 0; k < blen; k++) {
      matchNew.set(freeNew[bj + k]!.id, oldRects.get(freeOld[bi + k]!.id)!)
      matchedOld.add(oldIdx.get(freeOld[bi + k]!.id)!)
    }
    matchBlocks(oLo, bi, nLo, bj)
    matchBlocks(bi + blen, oHi, bj + blen, nHi)
  }
  matchBlocks(0, freeOld.length, 0, freeNew.length)

  // place every token at its "from" state …
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    const r = el.getBoundingClientRect()
    const from = matchNew.get(el.dataset.gdId!)
    if (from) {
      // position-only morph, like a mapped matrix cell: the token glides from
      // its old spot to its new one, never stretched. Centre-x + top anchoring
      // means a wide replacement (x_t → \underbrace{x_t}) wraps around the
      // old glyph where it stood instead of sliding in from the left edge.
      const dx = (from.left + from.width / 2 - (r.left + r.width / 2)) / scale
      const dy = (from.top - r.top) / scale
      if (dx !== 0 || dy !== 0) el.style.translate = `${dx}px ${dy}px`
    } else {
      // entering token: fade + rise, flashed crimson — this is what changed
      el.style.opacity = '0'
      el.style.translate = '0 0.3em'
      el.style.color = 'var(--crimson)'
    }
  })
  void stage.offsetWidth // reflow so the "from" states are the start point …
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    el.classList.add('gd-tok--anim')
    el.style.translate = ''
    el.style.opacity = ''
    el.style.color = ''
  })

  // … and let the removed tokens drift out of a ghost overlay
  const leaving = oldSeq.filter((_, i) => !matchedOld.has(i))
  if (leaving.length) {
    ghostToks.value = leaving.map((tk) => {
      const r = oldRects.get(tk.id)!
      return {
        key: ++ghostSeq,
        html: tk.html,
        cls: tk.cls,
        cell: !!tk.cell,
        left: (r.left - stageRect.left) / scale,
        top: (r.top - stageRect.top) / scale,
        width: r.width / scale,
      }
    })
    await nextTick()
    if (gen !== morphGen) return
    void stage.offsetWidth // reflow so the fade starts from a visible state …
    stage.querySelectorAll('.gd-ghost-tok').forEach(el => el.classList.add('gd-ghost-tok--out'))
    setTimeout(() => {
      if (gen === morphGen) ghostToks.value = []
    }, exitDur.value + 120)
  }
})

onUnmounted(() => { morphGen++ })
</script>

<template>
  <div
    ref="rootRef"
    class="gov-derivation"
    :class="[
      `gov-derivation--${size}`,
      `gov-derivation--hist-${historyPosition}`,
      {
        'gov-derivation--boxed': boxed,
        'gov-derivation--annotated': annotations?.length,
        'gov-derivation--gutter': annotationsVisible,
      },
    ]"
    :style="rootStyle"
    @click="onRootClick"
  >
    <div class="gd-main">
      <TransitionGroup
        v-if="showHistory"
        tag="div"
        class="gd-history"
        :class="{ 'gd-history--aligned': historyAligned }"
        name="gd-hist"
        aria-hidden="true"
      >
        <template v-for="row in ledgerRows" :key="row.key">
          <div
            v-if="row.kind === 'section'"
            class="gd-hist-section"
            aria-hidden="true"
            v-html="noteHtml(row.label)"
          ></div>
          <div
            v-else
            class="gd-hist-line"
            :class="{ 'gd-hist-line--aligned': historyParts[row.i] }"
          >
          <template v-if="historyParts[row.i]">
            <span class="gd-hist-part gd-hist-part--left" v-html="historyParts[row.i]!.left"></span>
            <span class="gd-hist-part gd-hist-part--mark" v-html="historyParts[row.i]!.mark"></span>
            <span class="gd-hist-part gd-hist-part--right" v-html="historyParts[row.i]!.right"></span>
          </template>
          <span v-else class="gd-hist-eq" v-html="historyHtml[row.i]"></span>
          <span v-if="historyNote(steps[row.i])" class="gd-hist-note" v-html="noteHtml(historyNote(steps[row.i])!)"></span>
            <span v-if="steps[row.i].tag !== undefined && steps[row.i].tag !== ''" class="gd-hist-tag">({{ steps[row.i].tag }})</span>
          </div>
        </template>
      </TransitionGroup>
      <div class="gd-current" :class="{ 'gd-current--empty': currentEmpty }">
        <div class="gd-current-inner">
        <div ref="stageRef" class="gd-stage">
          <Transition name="gd-focus">
            <div
              v-if="boxed && !currentEmpty"
              class="gd-focus-box"
              :class="{ 'gd-focus-box--ready': focusReady }"
              :style="focusBoxStyle"
              aria-hidden="true"
            ></div>
          </Transition>
          <div
            ref="equationRef"
            class="gd-equation"
            :class="{ 'gd-equation--empty': currentEmpty }"
            :aria-label="currentStep.tex"
          >
        <template v-for="nd in tokens" :key="nd.kind === 'env' ? nd.open.id : nd.kind === 'br' ? nd.id : nd.tok.id">
          <span
            v-if="nd.kind === 'br'"
            class="gd-br"
            aria-hidden="true"
          ></span>
          <template v-else-if="nd.kind === 'env'">
            <span
              v-if="nd.open.html"
              class="gd-tok gd-env-delim"
              :class="`gd-tok--${nd.open.cls}`"
              :data-gd-id="nd.open.id"
              :key="nd.open.id"
              v-html="nd.open.html"
            ></span>
            <span v-if="nd.boxed" class="gd-box">
              <template v-for="(c, ci) in nd.cells" :key="ci">
                <span v-if="c.brk" class="gd-br" aria-hidden="true"></span>
                <span
                  v-else
                  class="gd-tok"
                  :class="`gd-tok--${c.cls}`"
                  :data-gd-id="c.id"
                  v-html="c.html"
                ></span>
              </template>
            </span>
            <span v-else class="gd-matrix" :style="envGridStyle(nd.cells)">
              <span
                v-for="c in nd.cells"
                :key="c.id"
                class="gd-tok"
                :class="`gd-tok--${c.cls}`"
                :style="{ gridRow: c.cell!.row + 1, gridColumn: c.cell!.col + 1 }"
                :data-gd-id="c.id"
                v-html="c.html"
              ></span>
            </span>
            <span
              v-if="nd.close.html"
              class="gd-tok gd-env-delim"
              :class="`gd-tok--${nd.close.cls}`"
              :data-gd-id="nd.close.id"
              :key="nd.close.id"
              v-html="nd.close.html"
            ></span>
          </template>
          <span
            v-else
            class="gd-tok"
            :class="`gd-tok--${nd.tok.cls}`"
            :data-gd-id="nd.tok.id"
            v-html="nd.tok.html"
          ></span>
        </template>
      </div>
      <div v-if="ghostToks.length" class="gd-ghost" aria-hidden="true">
        <span
          v-for="g in ghostToks"
          :key="g.key"
          class="gd-ghost-tok"
          :class="[`gd-tok--${g.cls}`, g.cell ? 'gd-ghost-tok--cell' : '']"
          :style="{ left: `${g.left}px`, top: `${g.top}px`, width: `${g.width}px` }"
          v-html="g.html"
        ></span>
      </div>
        </div>
        <Transition name="gd-note" mode="out-in">
          <p v-if="currentNote" :key="currentNote" class="gd-note" v-html="currentNoteHtml"></p>
        </Transition>
        </div>
      </div>
    </div>
    <div v-if="placedAnnotations.length" class="gd-annotations">
      <svg
        class="gd-annotation-links"
        :class="{ 'gd-annotation-links--ready': annotationsReady }"
        aria-hidden="true"
      >
        <path v-for="a in placedAnnotations" :key="a.key" :d="a.path" />
        <circle
          v-for="a in placedAnnotations"
          :key="`${a.key}-dot`"
          :cx="a.dotX"
          :cy="a.dotTop"
          r="3.2"
        />
      </svg>
      <div
        v-for="(a, i) in placedAnnotations"
        :key="a.key"
        :ref="(el) => setBoxRef(i, el)"
        class="gd-annotation"
        :class="{ 'gd-annotation--ready': annotationsReady }"
        :style="{ top: `${a.boxTop}px`, '--gd-ann-delay': `${i * 80}ms` }"
      >
        <span class="gd-annotation-box">
          <span class="gd-annotation-num">{{ a.n }}</span>
          <span class="gd-annotation-text" v-html="noteHtml(a.text)"></span>
        </span>
      </div>
    </div>
    <div v-if="showProgress && steps.length > 1" class="gd-progress" aria-hidden="true">
      <span
        v-for="(s, i) in steps"
        :key="i"
        class="gd-dot"
        :class="{ 'gd-dot--on': i === stepIndex, 'gd-dot--done': i < stepIndex }"
      ></span>
    </div>
  </div>
</template>
