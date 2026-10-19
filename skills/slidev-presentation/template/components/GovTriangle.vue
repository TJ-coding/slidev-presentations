<script setup lang="ts">
// GovTriangle — the wide ▼ "therefore" mark. Never inside a data pipeline.
// Animated (default): drops into place on the next click.
// `animated="false"` renders it plain — for chains that animate a wrapper.
// `label` renders small ink text just above the ▼ (the condition of the
// implication, e.g. "When $n$ is large") — accepts HTML and $…$ / $$…$$ LaTeX.
// Usage:
//   <GovTriangle /> · <GovTriangle color="green" /> · <GovTriangle color="red" />
//   <GovTriangle dir="up" /> · <GovTriangle dir="left" /> · <GovTriangle dir="right" />
//   <GovTriangle label="When $n$ is large" />
import { typeset } from './math'
const props = defineProps<{
  color?: 'navy' | 'green' | 'red'
  /** pointing direction (default down) */
  dir?: 'down' | 'up' | 'left' | 'right'
  /** default true — v-click reveal; false for statically-driven chains */
  animated?: boolean
  /** HTML / LaTeX annotation rendered just above the ▼ */
  label?: string
}>()
const cls = [
  props.label ? 'gov-therefore--label' : '',
  props.color === 'green' ? 'gov-therefore--green' : props.color === 'red' ? 'gov-therefore--red' : '',
  props.dir === 'up' ? 'gov-therefore--up' :
  props.dir === 'left' ? 'gov-therefore--left' :
  props.dir === 'right' ? 'gov-therefore--right' : '',
].filter(Boolean).join(' ')
</script>

<template>
  <div v-if="animated" v-click class="slidev-vclick-anim-down gp-drop gov-therefore" :class="cls">
    <span v-if="label" class="gov-triangle-label" v-html="typeset(label)"></span>
  </div>
  <div v-else class="gp-drop gov-therefore" :class="cls">
    <span v-if="label" class="gov-triangle-label" v-html="typeset(label)"></span>
  </div>
</template>
