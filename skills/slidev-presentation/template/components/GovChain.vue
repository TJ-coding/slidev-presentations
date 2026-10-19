<script setup lang="ts">
// GovChain — the chainable "therefore" stack: TOP element → wide ▼ → BOTTOM element.
// On click the whole tail fades in while the triangle slides down to meet it —
// top → triangle → bottom arrive as one motion.
// top/bottom accept raw HTML; `label` annotates the triangle; slots accept
// markup; `steps` chains any number.
//
// Usage:
//   <GovChain top="<b>Installed Cache</b>" bottom="Drops Latency" />
//   <GovChain top-box="Installed Cache" bottom="Drops Latency" color="green" />
//   <GovChain top-box="$$\mathbf{A} \in \mathbb{C}^{n \times n}$$" bottom="Drops Latency" />
//   <GovChain top-box="Cache hit" bottom="Drops Latency" label="When $n$ is large" />
//   <GovChain
//     :steps="[
//       { topBox: 'Installed Cache', bottom: 'Drops Latency', label: 'When $n$ is large' },
//       { top: '<b>Free of LLM calls</b>', bottom: 'Scales linearly' },
//     ]" />
import GovTriangle from './GovTriangle.vue'
import GovBox from './GovBox.vue'
// top/bottom/labels accept HTML and $…$ / $$…$$ LaTeX (typeset via KaTeX)
import { typeset } from './math'

type Step = { topBox?: string; top?: string; bottom?: string; label?: string }
defineProps<{
  /** HTML for the top element (single mode) */
  top?: string
  /** label of a filled box top element (single mode) */
  topBox?: string
  /** HTML for the bottom element (single mode) */
  bottom?: string
  /** HTML / LaTeX annotation on the triangle (single mode) */
  label?: string
  /** triangle colour */
  color?: 'navy' | 'green' | 'red'
  /** chainable: any number of steps, rendered back-to-back */
  steps?: Step[]
}>()
</script>

<template>
  <div v-if="steps" class="gov-chain">
    <template v-for="(s, n) in steps" :key="n">
      <div class="gov-chain-item">
        <GovBox v-if="s.topBox" :label="s.topBox" />
        <span v-else-if="s.top" v-html="typeset(s.top)"></span>
      </div>
      <div v-click class="slidev-vclick-anim-fade-in gov-chain-tail">
        <GovTriangle :color="color ?? 'navy'" :animated="false" :label="s.label" />
        <div class="gov-chain-bottom" v-html="typeset(s.bottom)"></div>
      </div>
    </template>
  </div>
  <div v-else class="gov-chain">
    <div class="gov-chain-item">
      <slot name="top">
        <GovBox v-if="topBox" :label="topBox" />
        <span v-html="typeset(top)"></span>
      </slot>
    </div>
    <div v-click class="slidev-vclick-anim-fade-in gov-chain-tail">
      <slot name="triangle">
        <GovTriangle :color="color ?? 'navy'" :animated="false" :label="label" />
      </slot>
      <slot name="bottom">
        <div class="gov-chain-bottom" v-html="typeset(bottom)"></div>
      </slot>
    </div>
  </div>
</template>
