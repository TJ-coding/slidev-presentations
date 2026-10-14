<script setup lang="ts">
// GovArrow — the data arrow: example value rides ON TOP of the line,
// its name/explanation sits BELOW in ink (never grey, no boxes).
// Animated: slides in from the left on the next click (slidev-vclick).
// Static exports always show the final state.
// Usages:
//   <GovArrow value="こんにちは" label="x₁ · hypothesis" />
//   <template #value>…</template>
defineProps<{ value?: string; label?: string }>()
</script>

<template>
  <span v-click class="slidev-vclick-anim-right gp-glide gov-io">
    <span class="gov-io-value"><slot name="value">{{ value }}</slot></span>
    <span class="gov-io-line"></span>
    <span class="gov-io-label"><slot name="label">{{ label }}</slot></span>
  </span>
</template>
