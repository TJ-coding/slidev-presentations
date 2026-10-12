<script setup lang="ts">
// Reusable deck footer: shows deck title + slide number.
// Import once in slides.md frontmatter? No — use `global-bottom` layer instead:
// create global-bottom.vue importing this, or place per-layout.
const props = defineProps<{ deckTitle?: string }>()
</script>

<template>
  <footer class="deck-footer">
    <span class="title">{{ deckTitle || 'Presentation Title' }}</span>
    <span class="page"><SlideCurrentNo /> / <SlidesTotal /></span>
  </footer>
</template>

<style scoped>
.deck-footer {
  position: absolute;
  bottom: 0.8rem;
  left: 2rem;
  right: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.5;
}
.page { font-variant-numeric: tabular-nums; }
</style>
