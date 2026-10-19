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
//   // notes take plain text with inline math: `$…$` spans render via KaTeX
//   // (a note identical to the previous step's stays put — no fade/replay)
//   <GovDerivation :steps="[{ tex: '\\mathbf{A}x = b', note: 'Apply $\\mathbf{A}^{-1}$ on both sides' }]" />
//   // a step can opt out of the ledger — e.g. a tall matrix line:
//   <GovDerivation :steps="[{ tex: '\\mathbf{X} = …', history: false }]" />
//   // …or keep the equation but give its ledger line its own tex/note:
//   <GovDerivation :steps="[{ tex: '\\mathbf{X} = \\begin{bmatrix} …', note: 'full matrix', historyTex: '\\mathbf{X}', historyNote: 'snapshots' }]" />
//   <GovDerivation :steps="…" :history-size="0.7" :history-opacity="0.55" />

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'
import type { ClicksContext } from '@slidev/types'
import { renderNote, renderStep, renderTex, type RenderedTok, type TokClass } from './latex'

interface DerivationStep {
  tex: string
  /** note shown under the equation; `$…$` spans inside render as inline math */
  note?: string
  /** set false to keep this step out of the history ledger (default true) */
  history?: boolean
  /** LaTeX shown for this step in the history ledger instead of `tex` —
   *  e.g. a compact form when the full equation is too tall */
  historyTex?: string
  /** note shown for this step in the history ledger instead of `note` */
  historyNote?: string
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
  /** write completed steps below the equation as a ledger, so the audience can catch up */
  showHistory?: boolean
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
}>(), {
  duration: 700,
  size: 'lg',
  showProgress: true,
  showHistory: true,
})

const steps = computed<DerivationStep[]>(() =>
  props.steps.map(s => (typeof s === 'string' ? { tex: s } : s)),
)

/* root styling vars — historySize/historyOpacity only bind when set, so the
   CSS defaults (0.58 of the equation size, full opacity) stay in charge.
   Removed tokens fade out on a faster clock than the morph itself (--gd-exit-dur):
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

/* --- click budget: register one slot per morph ------------------------ */
/* The slide's click counter only advances through slots registered on the
   slide's clicks context — v-click elements do this from their directive.
   Without slots the first arrow press would navigate straight to the next
   slide and the derivation would never morph. Slots are registered at mount
   so DOM order is respected: v-click elements placed before the component
   keep the earlier clicks, ones placed after the component come later. */
const morphSlots = Array.from({ length: Math.max(0, steps.value.length - 1) }, () => ({}))
function registerMorphSlots() {
  if (!clicksCtx) return
  for (const el of morphSlots) {
    const info = clicksCtx.calculate('+1')
    if (info) clicksCtx.register(el, info)
  }
}
function unregisterMorphSlots() {
  if (!clicksCtx) return
  for (const el of morphSlots) clicksCtx.unregister(el)
}
onMounted(registerMorphSlots)

onUnmounted(unregisterMorphSlots)

const stepIndex = computed(() => {
  const max = Math.max(0, steps.value.length - 1)
  const c = navClicks ? navClicks.value : localClicks.value
  return Math.min(Math.max(c, 0), max)
})
const currentStep = computed(() => steps.value[stepIndex.value] ?? { tex: '' })
const tokens = computed(() => renderStep(currentStep.value.tex, canonTok))
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

/** canonical identity of a token tex: morphMap override, else the tex itself.
 *  Lookups tolerate script-brace variation: `x_2`/`x_{2}` and
 *  `_\text{state}`/`_{\text{state}}` both normalize the same, so map keys
 *  can be written the natural way. */
const normScript = (s: string) =>
  s
    .replace(/([_^])\{([a-zA-Z0-9])\}/g, '$1$2')
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

/* --- history ledger ---------------------------------------------------- */
/* Every step the derivation has passed is written below the equation —
   small, with its note — so anyone who missed a morph can still follow.
   Steps with `history: false` are omitted (useful for a tall matrix line
   that would bloat the ledger). Rendered once per tex and cached. In print
   the ledger lists every step except the last (the big equation shows the
   final step). */
const histCache = new Map<string, string>()
const historyHtml = computed<Record<number, string>>(() => {
  const m: Record<number, string> = {}
  for (let i = 0; i < steps.value.length; i++) {
    const tex = steps.value[i]!.historyTex ?? steps.value[i]!.tex
    if (!histCache.has(tex)) histCache.set(tex, renderTex(tex))
    m[i] = histCache.get(tex)!
  }
  return m
})
const historyNote = (step: DerivationStep | undefined) => step?.historyNote ?? step?.note
const visited = computed(() => {
  const out: number[] = []
  for (let i = 0; i < stepIndex.value; i++) {
    if (steps.value[i]?.history !== false) out.push(i)
  }
  return out
})

/* --- morphing ---------------------------------------------------------- */
const stageRef = ref<HTMLElement | null>(null)

interface GhostTok {
  key: number
  html: string
  cls: TokClass
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

  // settle any in-flight morph so measurements start from a clean layout
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    el.classList.remove('gd-tok--anim')
    el.style.cssText = ''
  })
  ghostToks.value = []

  // measure the outgoing tokens — the DOM still shows step o
  const oldRects = new Map<string, { left: number; top: number; width: number }>()
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    const r = el.getBoundingClientRect()
    oldRects.set(el.dataset.gdId!, { left: r.left, top: r.top, width: r.width })
  })
  const oldToks = renderStep(steps.value[o].tex, canonTok)
  const newToks = renderStep(steps.value[n].tex, canonTok)
  const newIds = new Set(newToks.map(t => t.id))
  const leaving = [...oldRects.keys()].filter(id => !newIds.has(id))

  await nextTick() // the DOM now shows step n
  if (gen !== morphGen) return

  // the slide may be CSS-scaled (Slidev fits it to the viewport) — measure
  // in viewport px, then convert back to the element's local px
  const stageRect = stage.getBoundingClientRect()
  const scale = stageRect.width / stage.offsetWidth || 1

  // place every token at its "from" state …
  stage.querySelectorAll<HTMLElement>('.gd-tok').forEach((el) => {
    const old = oldRects.get(el.dataset.gdId!)
    if (old) {
      const r = el.getBoundingClientRect()
      // position-only morph, like a mapped matrix cell: the token glides from
      // its old spot to its new one, never stretched. Centre-x + top anchoring
      // means a wide replacement (x_t → \underbrace{x_t}) wraps around the
      // old glyph where it stood instead of sliding in from the left edge.
      const dx = (old.left + old.width / 2 - (r.left + r.width / 2)) / scale
      const dy = (old.top - r.top) / scale
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
  if (leaving.length) {
    ghostToks.value = leaving.map((id) => {
      const r = oldRects.get(id)!
      const tk = oldToks.find(t => t.id === id)!
      return {
        key: ++ghostSeq,
        html: tk.html,
        cls: tk.cls,
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
    class="gov-derivation"
    :class="`gov-derivation--${size}`"
    :style="rootStyle"
    @click="onRootClick"
  >
    <div ref="stageRef" class="gd-stage">
      <div class="gd-equation" :aria-label="currentStep.tex">
        <span
          v-for="t in tokens"
          :key="t.id"
          class="gd-tok"
          :class="`gd-tok--${t.cls}`"
          :data-gd-id="t.id"
          v-html="t.html"
        ></span>
      </div>
      <div v-if="ghostToks.length" class="gd-ghost" aria-hidden="true">
        <span
          v-for="g in ghostToks"
          :key="g.key"
          class="gd-ghost-tok"
          :class="`gd-tok--${g.cls}`"
          :style="{ left: `${g.left}px`, top: `${g.top}px`, width: `${g.width}px` }"
          v-html="g.html"
        ></span>
      </div>
    </div>
    <TransitionGroup v-if="showHistory" tag="div" class="gd-history" name="gd-hist" aria-hidden="true">
      <div
        v-for="i in visited"
        :key="i"
        class="gd-hist-line"
      >
        <span class="gd-hist-eq" v-html="historyHtml[i]"></span>
        <span v-if="historyNote(steps[i])" class="gd-hist-note" v-html="noteHtml(historyNote(steps[i])!)"></span>
      </div>
    </TransitionGroup>
    <Transition name="gd-note" mode="out-in">
      <p v-if="currentNote" :key="currentNote" class="gd-note" v-html="currentNoteHtml"></p>
    </Transition>
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
