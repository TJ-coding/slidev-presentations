<script setup lang="ts">
// GovPipe — N inputs flow through one stage into M outputs.
// Values ride ON TOP of their arrows, names sit BELOW in ink (no grey,
// no boxes for I/O; only the stage may carry a shape).
//
// Usage 1 — arbitrary inputs/outputs (each { value, label }):
//   <GovPipe
//     :inputs="[{ value: 'こんにちは', label: 'x₁ · hypothesis' },
//               { value: 'Hello',     label: 'x₂ · reference' }]"
//     :outputs="[{ value: 'Hello', label: 'ŷ · output' }]">
//     <template #stage>
//       <span class="gov-node gov-node--icon">
//         <carbon:filter class="gov-node-icon" />
//         <span class="gov-node-sub">select min</span>
//       </span>
//     </template>
//   </GovPipe>
//
// Usage 2 — stage as a filled box instead of an icon:
//   <GovPipe :inputs="[…]" :outputs="[…]" stage-box="Installed Cache" />
import GovArrow from './GovArrow.vue'
import GovBox from './GovBox.vue'

type Item = { value?: string; label?: string }
defineProps<{ inputs?: Item[]; outputs?: Item[]; stageBox?: string }>()
</script>

<template>
  <div class="gov-flow" style="gap: 0.5rem;">
    <div class="gov-pipe-in">
      <slot name="inputs">
        <GovArrow v-for="(i, n) in inputs ?? []" :key="n" :value="i.value" :label="i.label" />
      </slot>
    </div>
    <div class="gov-pipe-stage">
      <slot name="stage">
        <GovBox v-if="stageBox" :label="stageBox" />
      </slot>
    </div>
    <div class="gov-pipe-out">
      <slot name="outputs">
        <GovArrow v-for="(o, n) in outputs ?? []" :key="n" :value="o.value" :label="o.label" />
      </slot>
    </div>
  </div>
</template>
