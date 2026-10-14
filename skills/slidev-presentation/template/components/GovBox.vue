<script setup lang="ts">
// GovBox — filled label block (navy fill, white text).
// `inverted` flips it: white fill, navy text + navy outline.
// Usages:
//   <GovBox label="Installed Cache" />
//   <GovBox inverted label="Installed Cache" />
defineProps<{ label?: string; inverted?: boolean }>()
</script>

<template>
  <div class="gov-box" :class="{ 'gov-box--inverted': inverted }">
    <slot>{{ label }}</slot>
  </div>
</template>
