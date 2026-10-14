<script setup lang="ts">
// GovTriangle — the wide ▼ "therefore" mark. Never inside a data pipeline.
// Animated (default): drops into place on the next click.
// `animated="false"` renders it plain — for chains that animate a wrapper.
// Usage:
//   <GovTriangle /> · <GovTriangle color="green" /> · <GovTriangle color="red" />
//   <GovTriangle dir="up" /> · <GovTriangle dir="left" /> · <GovTriangle dir="right" />
const props = defineProps<{
  color?: 'navy' | 'green' | 'red'
  /** pointing direction (default down) */
  dir?: 'down' | 'up' | 'left' | 'right'
  /** default true — v-click reveal; false for statically-driven chains */
  animated?: boolean
}>()
const cls = [
  props.color === 'green' ? 'gov-therefore--green' : props.color === 'red' ? 'gov-therefore--red' : '',
  props.dir === 'up' ? 'gov-therefore--up' :
  props.dir === 'left' ? 'gov-therefore--left' :
  props.dir === 'right' ? 'gov-therefore--right' : '',
].filter(Boolean).join(' ')
</script>

<template>
  <div v-if="animated" v-click class="slidev-vclick-anim-down gp-drop gov-therefore" :class="cls"></div>
  <div v-else class="gp-drop gov-therefore" :class="cls"></div>
</template>
