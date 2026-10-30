<script setup lang="ts">
// GovStress — the verdict "textbox with infill header".
// Filled navy label band over a bordered white value box.
// Usage: <GovStress label="Latency">410 → 40 ms</GovStress>
//   <GovStress value="Issue: <span class='gov-stress-value--red'>O(n²)</span>" />
//   <GovStress value="… $\\mathbf{A}$ …" />            // headless solo box —
//     no label band, the body closes its own top border (`gov-stress--solo`);
//     label/value typeset $…$ / $$…$$ via KaTeX, slots carry inline markup
// `inverted` flips the value box: navy fill, white text (GovBox-style flip;
// the muted --red/--green/--blue value colors read on navy).
// Styles come from the theme's .gov-stress / -head / -body classes.
import { computed, useSlots } from 'vue'
// $…$ in props never passes through markdown — typeset here (see ./math.ts)
import { typeset } from './math'

const props = defineProps<{ label?: string; value?: string; inverted?: boolean }>()
const slots = useSlots()
const hasLabel = computed(() => !!(props.label ?? '').trim() || !!slots.label)
const labelHtml = computed(() => typeset(props.label ?? ''))
const valueHtml = computed(() => typeset(props.value ?? ''))
</script>

<template>
  <div class="gov-stress" :class="{ 'gov-stress--solo': !hasLabel, 'gov-stress--inverted': inverted }">
    <div v-if="hasLabel" class="gov-stress-head">
      <slot name="label"><span v-html="labelHtml" /></slot>
    </div>
    <div class="gov-stress-body">
      <slot>
        <span v-if="value" v-html="valueHtml" />
      </slot>
    </div>
  </div>
</template>
