<script setup lang="ts">
// Page number, bottom-right, grey — like the reference decks.
// Hidden on cover/section/end layouts. $nav is auto-provided to global layers.
const excluded = new Set(['govuk-cover', 'govuk-section', 'govuk-end'])
const footerOn = ($slidev.configs as Record<string, unknown>).deckFooter !== false
</script>

<template>
  <div
    v-if="footerOn && $nav.currentLayout && !excluded.has(String($nav.currentLayout))"
    class="gov-page-float"
  >
    <SlideCurrentNo />
  </div>
</template>

<style scoped>
.gov-page-float {
  position: absolute;
  right: 1.6rem;
  bottom: 0.8rem;
  font-size: 1rem;
  color: var(--govuk-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
