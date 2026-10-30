<script setup lang="ts">
// GovChain — the chainable "therefore" stack: TOP element(s) → wide ▼ → BOTTOM element(s).
// Like GovPipe, either side is a list: N premises converge on the ▼ ("these,
// therefore …") and M conclusions fan out below it ("…therefore these"); either
// side may be empty, leaving a lone ▼ (annotate it with `label`).
// Multiple items stack PERPENDICULAR to the flow, GovPipe-style:
//   dir down/up (default) — vertical chain, tops & bottoms side by side in rows
//   dir left/right        — horizontal chain, tops & bottoms stacked in columns
// `lefts` / `rights` add side branches: with a vertical ▼ they flank it; when a
// step has only `rights` (or only `lefts`) and no bottoms, the step turns
// horizontal and the triangle points that way.
// On click the whole tail fades in while the triangle slides in to meet the
// bottoms — top → triangle → side/bottom arrives as one motion.
// When the usage anchors the component with an ABSOLUTE v-click (e.g.
// <GovChain v-click="4" :steps="…" />) the tails are pinned to that anchor:
// the first tail (with step 0's tops) shows at click 4, each later tail one
// click after. Without this, the inner tails resolve relative to the slide's
// running click offset and land out of sync with the container's reveal.
// `at` overrides the anchor explicitly for wrapper-based usages.
// Items accept raw HTML strings or { box: '…' } for a filled GovBox — add
// `inverted: true` for the white box with a navy outline and `size` to set
// the text size (number = em multiplier, string = CSS length). `label`
// annotates the triangle. Everything accepts $…$ / $$…$$ LaTeX (KaTeX).
//
// Usage:
//   <GovChain top="Installed Cache" bottom="Drops Latency" />  (tops & bottoms both bold)
//   <GovChain top-box="Installed Cache" bottom="Drops Latency" color="green" />
//   <GovChain top-box="$$\mathbf{A} \in \mathbb{C}^{n \times n}$$" bottom="Drops Latency" />
//   <GovChain top-box="Cache hit" bottom="Drops Latency" label="When $n$ is large" />
//   <GovChain top-box="Cache hit" :bottoms="[{ box: 'Drops Latency', inverted: true }]" />
//   <GovChain :bottoms="[{ box: 'Drops Latency', size: 1.2 }]" />      // 120% text
//   <GovChain :tops="[{ box: 'Cache hit', size: '0.8rem' }]" />       // CSS length
//   <GovChain top-box="Cache hit" bottom-box="Drops Latency" />      // filled both sides
//   <GovChain :rights="[{ box: 'Infeasible' }]" />                   // ▶ Infeasible
//   <GovChain :lefts="[{ box: 'Infeasible' }]" />                    // Infeasible ◀
//   <GovChain top-box="A is n×n" :rights="['Infeasible']" :bottoms="['O(n³)']" />
//   <GovChain label="Why Linear?" bottom="Memory Efficiency" />      // 0 → 1: lone ▼
//   <GovChain top-box="Cache hit" />                                // 1 → 0: ▼ alone
//   <GovChain
//     :tops="['$$\\mathbf{A} \\in \\mathbb{C}^{n \\times n}$$', { box: 'n is large' }]"
//     :bottoms="['A is infeasible', { box: 'O(n³) flops' }]"
//     label="When $n$ is large" />                                   // 2 → 2, fan in rows
//   <GovChain dir="right" top-box="Cache hit" :bottoms="['Drops Latency', 'No LLM calls']" />
//   <GovChain
//     :steps="[
//       { tops: ['Installed Cache'], bottoms: ['Drops Latency'], label: 'When $n$ is large' },
//       { top: '<b>Free of LLM calls</b>', bottom: 'Scales linearly' },
//     ]" />
//   <GovChain
//     :steps="[
//       { tops: ['If $n$ = 1 billion'], bottoms: ['4,000 PB'] },
//       { rights: ['Infeasible'] },
//     ]" />                                                          // vertical, then ▶ branch
import { computed, getCurrentInstance, h } from 'vue'
import GovTriangle from './GovTriangle.vue'
import GovBox from './GovBox.vue'
// top/bottom/labels accept HTML and $…$ / $$…$$ LaTeX (typeset via KaTeX)
import { typeset } from './math'

type BoxItem = { html?: string; box?: string; inverted?: boolean; size?: string | number }
type Item = string | BoxItem
type Dir = 'down' | 'up' | 'left' | 'right'
type SideKey = 'top' | 'bottom' | 'left' | 'right'
type Step = {
  tops?: Item[]
  topBox?: string
  top?: string
  bottoms?: Item[]
  bottomBox?: string
  bottom?: string
  lefts?: Item[]
  rights?: Item[]
  label?: string
  dir?: Dir
}

const props = defineProps<{
  /** HTML for the top element (single mode) — empty string means no top */
  top?: string
  /** label of a box top element (single mode) */
  topBox?: string
  /** any number of top elements: HTML strings and/or { box: '…', inverted?: true } */
  tops?: Item[]
  /** HTML for the bottom element (single mode) — empty string means no bottom */
  bottom?: string
  /** label of a box bottom element (single mode) */
  bottomBox?: string
  /** any number of bottom elements: HTML strings and/or { box: '…', inverted?: true } */
  bottoms?: Item[]
  /** any number of left elements (side branch) */
  lefts?: Item[]
  /** any number of right elements (side branch) */
  rights?: Item[]
  /** HTML / LaTeX annotation on the triangle (single mode) */
  label?: string
  /** triangle colour */
  color?: 'navy' | 'green' | 'red'
  /** pointing direction (default down) — down/up run the chain vertically,
      left/right horizontally (triangle points at the bottoms) */
  dir?: Dir
  /** chainable: any number of steps, rendered back-to-back */
  steps?: Step[]
  /** absolute click at which the tails start (overrides the component's own
      v-click anchor); step k's tail shows at `at + k` */
  at?: number
}>()

// Anchor for the tail clicks. Normally the tails are RELATIVE v-clicks
// ('+1' each), sequenced by slide DOM order — that is what makes a bare
// <GovChain :steps="…" /> step on consecutive clicks. But when the usage
// pins the component itself to an absolute click (<GovChain v-click="4">),
// the container hides until click 4 while the relative tails still resolve
// from the running offset — landing one or more clicks BEFORE the reveal.
// So if the component carries an absolute v-click (or an explicit `at`
// prop), pin every tail to that anchor: tail k → anchor + k.
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
// undefined (null here) keeps the bare relative v-click behaviour
const tailAt = (k: number) => (anchor.value == null ? undefined : anchor.value + k)

// Normalise one side into renderable items. Sugar order: explicit list wins,
// then the box sugar, then the raw-HTML sugar (empty = deliberately absent).
const itemsOf = (multi?: Item[], box?: string, single?: string): BoxItem[] => {
  if (multi && multi.length) return multi.map((i) => (typeof i === 'object' ? i : { html: i }))
  if (box) return [{ box }]
  return single ? [{ html: single }] : []
}

// per-item text size: number = em multiplier, string = raw CSS length
const itemStyle = (size?: string | number) =>
  size == null || size === ''
    ? undefined
    : { fontSize: typeof size === 'number' ? `${size}em` : size }

const isHorizontal = (d: Dir) => d === 'left' || d === 'right'

// A lone right/left branch turns the step horizontal; bottoms keep it vertical.
const inferDir = (bottom: BoxItem[], left: BoxItem[], right: BoxItem[], explicit?: Dir): Dir => {
  if (explicit) return explicit
  if (!bottom.length && right.length && !left.length) return 'right'
  if (!bottom.length && left.length && !right.length) return 'left'
  return 'down'
}

const side = (key: SideKey, items: BoxItem[]) => (items.length ? [{ key, items }] : [])

const buildModel = (
  tops: BoxItem[],
  bottoms: BoxItem[],
  lefts: BoxItem[],
  rights: BoxItem[],
  explicit?: Dir,
) => {
  const dir = inferDir(bottoms, lefts, rights, explicit)
  const horizontal = isHorizontal(dir)
  const rightward = dir === 'right'
  return {
    dir,
    horizontal,
    // A side branch inferred from `lefts`/`rights` gets a compact ◀/▶; an
    // explicit `dir` keeps the full-size horizontal triangle.
    compact: horizontal && !explicit,
    tops,
    bottoms,
    lefts,
    rights,
    // Horizontal flow: premises sit behind the triangle, conclusions beyond it.
    premises: horizontal
      ? [...side('top', tops), ...side(rightward ? 'left' : 'right', rightward ? lefts : rights)]
      : [],
    conclusions: horizontal
      ? [...side('bottom', bottoms), ...side(rightward ? 'right' : 'left', rightward ? rights : lefts)]
      : [],
  }
}

const stepModels = computed(() =>
  (props.steps ?? []).map((s) => ({
    s,
    ...buildModel(
      itemsOf(s.tops, s.topBox, s.top),
      itemsOf(s.bottoms, s.bottomBox, s.bottom),
      itemsOf(s.lefts),
      itemsOf(s.rights),
      s.dir ?? props.dir,
    ),
  })),
)

const main = computed(() =>
  buildModel(
    itemsOf(props.tops, props.topBox, props.top),
    itemsOf(props.bottoms, props.bottomBox, props.bottom),
    itemsOf(props.lefts),
    itemsOf(props.rights),
    props.dir,
  ),
)

// Render one side's items with the right semantic class (gov-chain-top, …).
const ChainList = (list: { items: BoxItem[]; side: SideKey }) => {
  const tag = list.side === 'top' ? 'span' : 'div'
  return list.items.map((it, i) =>
    it.box
      ? h(GovBox, {
          key: i,
          class: `gov-chain-${list.side}`,
          label: it.box,
          inverted: it.inverted,
          size: it.size,
        })
      : h(tag, {
          key: i,
          class: `gov-chain-${list.side}`,
          style: itemStyle(it.size),
          innerHTML: typeset(it.html ?? ''),
        }),
  )
}
</script>

<template>
  <div v-if="steps" class="gov-chain gov-chain--v">
    <template v-for="(m, n) in stepModels" :key="n">
      <div
        v-if="m.horizontal"
        class="gov-chain gov-chain--h"
        :class="{ 'gov-chain--left': m.dir === 'left' }"
      >
        <div v-for="g in m.premises" :key="g.key" class="gov-chain-item">
          <ChainList :items="g.items" :side="g.key" />
        </div>
        <div v-click="tailAt(n)" class="slidev-vclick-anim-fade-in gov-chain-tail">
          <GovTriangle
            v-if="m.dir === 'right'"
            :class="{ 'gov-therefore--sm': m.compact && !m.s.label }"
            :color="color ?? 'navy'"
            :animated="false"
            :label="m.s.label"
            :dir="m.dir"
          />
          <div v-for="g in m.conclusions" :key="g.key" class="gov-chain-item">
            <ChainList :items="g.items" :side="g.key" />
          </div>
          <GovTriangle
            v-if="m.dir === 'left'"
            :class="{ 'gov-therefore--sm': m.compact && !m.s.label }"
            :color="color ?? 'navy'"
            :animated="false"
            :label="m.s.label"
            :dir="m.dir"
          />
        </div>
      </div>
      <template v-else>
        <div v-if="m.tops.length" class="gov-chain-item">
          <ChainList :items="m.tops" side="top" />
        </div>
        <div v-click="tailAt(n)" class="slidev-vclick-anim-fade-in gov-chain-tail">
          <div v-if="m.lefts.length || m.rights.length" class="gov-chain-cross">
            <div v-if="m.lefts.length" class="gov-chain-side">
              <ChainList :items="m.lefts" side="left" />
            </div>
            <GovTriangle
              :color="color ?? 'navy'"
              :animated="false"
              :label="m.s.label"
              :dir="m.dir"
            />
            <div v-if="m.rights.length" class="gov-chain-side">
              <ChainList :items="m.rights" side="right" />
            </div>
          </div>
          <GovTriangle
            v-else
            :color="color ?? 'navy'"
            :animated="false"
            :label="m.s.label"
            :dir="m.dir"
          />
          <div v-if="m.bottoms.length" class="gov-chain-item">
            <ChainList :items="m.bottoms" side="bottom" />
          </div>
        </div>
      </template>
    </template>
  </div>
  <div
    v-else
    class="gov-chain"
    :class="[
      main.horizontal ? 'gov-chain--h' : 'gov-chain--v',
      { 'gov-chain--left': main.dir === 'left' },
    ]"
  >
    <template v-if="main.horizontal">
      <div v-if="$slots.top || main.premises.length" class="gov-chain-item">
        <slot name="top">
          <template v-for="g in main.premises" :key="g.key">
            <ChainList :items="g.items" :side="g.key" />
          </template>
        </slot>
      </div>
      <div v-click="tailAt(0)" class="slidev-vclick-anim-fade-in gov-chain-tail">
        <slot v-if="main.dir === 'right'" name="triangle">
          <GovTriangle
            :class="{ 'gov-therefore--sm': main.compact && !label }"
            :color="color ?? 'navy'"
            :animated="false"
            :label="label"
            :dir="main.dir"
          />
        </slot>
        <div v-if="$slots.bottom || main.conclusions.length" class="gov-chain-item">
          <slot name="bottom">
            <template v-for="g in main.conclusions" :key="g.key">
              <ChainList :items="g.items" :side="g.key" />
            </template>
          </slot>
        </div>
        <slot v-if="main.dir === 'left'" name="triangle">
          <GovTriangle
            :class="{ 'gov-therefore--sm': main.compact && !label }"
            :color="color ?? 'navy'"
            :animated="false"
            :label="label"
            :dir="main.dir"
          />
        </slot>
      </div>
    </template>
    <template v-else>
      <div v-if="$slots.top || main.tops.length" class="gov-chain-item">
        <slot name="top">
          <ChainList :items="main.tops" side="top" />
        </slot>
      </div>
      <div v-click="tailAt(0)" class="slidev-vclick-anim-fade-in gov-chain-tail">
        <div v-if="main.lefts.length || main.rights.length" class="gov-chain-cross">
          <div v-if="main.lefts.length" class="gov-chain-side">
            <ChainList :items="main.lefts" side="left" />
          </div>
          <slot name="triangle">
            <GovTriangle :color="color ?? 'navy'" :animated="false" :label="label" :dir="main.dir" />
          </slot>
          <div v-if="main.rights.length" class="gov-chain-side">
            <ChainList :items="main.rights" side="right" />
          </div>
        </div>
        <slot v-else name="triangle">
          <GovTriangle
            :color="color ?? 'navy'"
            :animated="false"
            :label="label"
            :dir="main.dir"
          />
        </slot>
        <div v-if="$slots.bottom || main.bottoms.length" class="gov-chain-item">
          <slot name="bottom">
            <ChainList :items="main.bottoms" side="bottom" />
          </slot>
        </div>
      </div>
    </template>
  </div>
</template>
