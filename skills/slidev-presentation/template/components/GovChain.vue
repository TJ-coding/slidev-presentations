<script setup lang="ts">
// GovChain — the chainable "therefore" stack: TOP element(s) → wide ▼ → BOTTOM element(s).
// Like GovPipe, either side is a list: N premises converge on the ▼ ("these,
// therefore …") and M conclusions fan out below it ("…therefore these"); either
// side may be empty, leaving a lone ▼ (annotate it with `label`).
// Multiple items stack PERPENDICULAR to the flow, GovPipe-style:
//   dir down/up (default) — vertical chain, tops & bottoms side by side in rows
//   dir left/right        — horizontal chain, tops & bottoms stacked in columns
// On click the whole tail fades in while the triangle slides down to meet the
// bottoms — top → triangle → bottom arrive as one motion.
// Items accept raw HTML strings or { box: '…' } for a filled GovBox — add
// `inverted: true` for the white box with a navy outline. `label` annotates the
// triangle. Everything accepts $…$ / $$…$$ LaTeX (KaTeX).
//
// Usage:
//   <GovChain top="Installed Cache" bottom="Drops Latency" />  (tops & bottoms both bold)
//   <GovChain top-box="Installed Cache" bottom="Drops Latency" color="green" />
//   <GovChain top-box="$$\mathbf{A} \in \mathbb{C}^{n \times n}$$" bottom="Drops Latency" />
//   <GovChain top-box="Cache hit" bottom="Drops Latency" label="When $n$ is large" />
//   <GovChain top-box="Cache hit" :bottoms="[{ box: 'Drops Latency', inverted: true }]" />
//   <GovChain top-box="Cache hit" bottom-box="Drops Latency" />      // filled both sides
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
import { computed } from 'vue'
import GovTriangle from './GovTriangle.vue'
import GovBox from './GovBox.vue'
// top/bottom/labels accept HTML and $…$ / $$…$$ LaTeX (typeset via KaTeX)
import { typeset } from './math'

type BoxItem = { html?: string; box?: string; inverted?: boolean }
type Item = string | BoxItem
type Step = {
  tops?: Item[]
  topBox?: string
  top?: string
  bottoms?: Item[]
  bottomBox?: string
  bottom?: string
  label?: string
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
  /** HTML / LaTeX annotation on the triangle (single mode) */
  label?: string
  /** triangle colour */
  color?: 'navy' | 'green' | 'red'
  /** pointing direction (default down) — down/up run the chain vertically,
      left/right horizontally (triangle points at the bottoms) */
  dir?: 'down' | 'up' | 'left' | 'right'
  /** chainable: any number of steps, rendered back-to-back */
  steps?: Step[]
}>()

// Normalise one side into renderable items. Sugar order: explicit list wins,
// then the box sugar, then the raw-HTML sugar (empty = deliberately absent).
const itemsOf = (multi?: Item[], box?: string, single?: string): BoxItem[] => {
  if (multi && multi.length) return multi.map((i) => (typeof i === 'object' ? i : { html: i }))
  if (box) return [{ box }]
  return single ? [{ html: single }] : []
}

const topItems = computed(() => itemsOf(props.tops, props.topBox, props.top))
const bottomItems = computed(() => itemsOf(props.bottoms, props.bottomBox, props.bottom))
// horizontal chain (dir left/right) flips the layout: tops column → ◀/▶ → bottoms column
const horizontal = computed(() => props.dir === 'left' || props.dir === 'right')
</script>

<template>
  <div v-if="steps" class="gov-chain" :class="horizontal ? 'gov-chain--h' : 'gov-chain--v'">
    <template v-for="(s, n) in steps" :key="n">
      <div v-if="itemsOf(s.tops, s.topBox, s.top).length" class="gov-chain-item">
        <template v-for="(t, i) in itemsOf(s.tops, s.topBox, s.top)" :key="i">
          <GovBox v-if="t.box" class="gov-chain-top" :label="t.box" :inverted="t.inverted" />
          <span v-else class="gov-chain-top" v-html="typeset(t.html ?? '')"></span>
        </template>
      </div>
      <div v-click class="slidev-vclick-anim-fade-in gov-chain-tail">
        <GovTriangle :color="color ?? 'navy'" :animated="false" :label="s.label" :dir="dir" />
        <div v-if="itemsOf(s.bottoms, s.bottomBox, s.bottom).length" class="gov-chain-item">
          <template v-for="(b, i) in itemsOf(s.bottoms, s.bottomBox, s.bottom)" :key="i">
            <GovBox v-if="b.box" class="gov-chain-bottom" :label="b.box" :inverted="b.inverted" />
            <div v-else class="gov-chain-bottom" v-html="typeset(b.html ?? '')"></div>
          </template>
        </div>
      </div>
    </template>
  </div>
  <div v-else class="gov-chain" :class="horizontal ? 'gov-chain--h' : 'gov-chain--v'">
    <div v-if="$slots.top || topItems.length" class="gov-chain-item">
      <slot name="top">
        <template v-for="(t, i) in topItems" :key="i">
          <GovBox v-if="t.box" class="gov-chain-top" :label="t.box" :inverted="t.inverted" />
          <span v-else class="gov-chain-top" v-html="typeset(t.html ?? '')"></span>
        </template>
      </slot>
    </div>
    <div v-click class="slidev-vclick-anim-fade-in gov-chain-tail">
      <slot name="triangle">
        <GovTriangle :color="color ?? 'navy'" :animated="false" :label="label" :dir="dir" />
      </slot>
      <slot name="bottom">
        <div v-if="bottomItems.length" class="gov-chain-item">
          <template v-for="(b, i) in bottomItems" :key="i">
            <GovBox v-if="b.box" class="gov-chain-bottom" :label="b.box" :inverted="b.inverted" />
            <div v-else class="gov-chain-bottom" v-html="typeset(b.html ?? '')"></div>
          </template>
        </div>
      </slot>
    </div>
  </div>
</template>
