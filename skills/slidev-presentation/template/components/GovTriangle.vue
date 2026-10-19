<script setup lang="ts">
// GovTriangle — the wide ▼ "therefore" mark. Never inside a data pipeline.
// Animated (default): drops into place on the next click.
// `animated="false"` renders it plain — for chains that animate a wrapper.
// `label` renders short HTML/LaTeX as plain white text directly on the fill,
// centred on the triangle's centroid. The labeled ▼ grows into a broad
// arrowhead (15.6 × 4.6) wide enough to carry one line clear of its slanted
// edges — one colour, one glyph, same white-on-navy as the boxes
// (e.g. "When $n$ is large").
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
  /** HTML / LaTeX annotation rendered inside the shape */
  label?: string
}>()
const cls = [
  props.color === 'green' ? 'gov-therefore--green' : props.color === 'red' ? 'gov-therefore--red' : '',
  props.dir === 'up' ? 'gov-therefore--up' :
  props.dir === 'left' ? 'gov-therefore--left' :
  props.dir === 'right' ? 'gov-therefore--right' : '',
].filter(Boolean).join(' ')
const tagCls = [
  props.color === 'green' ? 'gov-therefore-tag--green' : props.color === 'red' ? 'gov-therefore-tag--red' : '',
  props.dir === 'up' ? 'gov-therefore-tag--up' :
  props.dir === 'left' ? 'gov-therefore-tag--left' :
  props.dir === 'right' ? 'gov-therefore-tag--right' : '',
].filter(Boolean).join(' ')
</script>

<template>
  <div v-if="label && animated" v-click class="slidev-vclick-anim-down gp-drop gov-therefore-tag" :class="tagCls">
    <div class="gov-triangle-label" v-html="typeset(label)"></div>
    <div class="gov-therefore" :class="cls"></div>
  </div>
  <div v-else-if="label" class="gp-drop gov-therefore-tag" :class="tagCls">
    <div class="gov-triangle-label" v-html="typeset(label)"></div>
    <div class="gov-therefore" :class="cls"></div>
  </div>
  <div v-else-if="animated" v-click class="slidev-vclick-anim-down gp-drop gov-therefore" :class="cls"></div>
  <div v-else class="gp-drop gov-therefore" :class="cls"></div>
</template>
