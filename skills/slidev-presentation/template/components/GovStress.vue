<script setup lang="ts">
// GovStress — the verdict "textbox with infill header".
// Filled navy label band over a bordered white value box.
// Usage: <GovStress label="Latency">410 → 40 ms</GovStress>
// Styles come from the theme's .gov-stress / -head / -body classes;
// label and value may hold any inline markup via the slots.
defineProps<{ label?: string; value?: string }>()
</script>

<template>
  <div class="gov-stress">
    <div class="gov-stress-head"><slot name="label">{{ label }}</slot></div>
    <div class="gov-stress-body"><slot>{{ value }}</slot></div>
  </div>
</template>
