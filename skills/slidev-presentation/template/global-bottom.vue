<script setup lang="ts">
// Page number, bottom-right — like the reference decks.
// Grey on light slides, translucent white on the navy section dividers;
// hidden on cover/end layouts. $nav is auto-provided to global layers.
//
// Render $nav.currentSlideNo directly, NOT <SlideCurrentNo />: in stacked
// print/export renders <SlideCurrentNo /> reads $page from the app-route
// nav (stuck at 1), while $nav here is the per-slide context nav.
const excluded = new Set(['govuk-cover', 'govuk-end'])
const footerOn = ($slidev.configs as Record<string, unknown>).deckFooter !== false
const onDark = $nav && String($nav.currentLayout) === 'govuk-section'
</script>

<template>
  <div
    v-if="footerOn && $nav.currentLayout && !excluded.has(String($nav.currentLayout))"
    class="gov-page-float"
    :class="{ 'gov-page-float--dark': onDark }"
  >
    {{ $nav.currentSlideNo }}
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
.gov-page-float--dark {
  color: rgba(255, 255, 255, 0.55);
}
</style>
