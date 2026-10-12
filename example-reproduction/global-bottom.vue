<script setup lang="ts">
// Page number, bottom-right, grey — like the user's reference decks.
// Hidden on cover/section slides.
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'

const { $slidev } = useSlideContext()
const excluded = ['govuk-cover', 'govuk-section', 'govuk-end']
const layout = computed(() => $slidev.nav.currentLayout.value)
</script>

<template>
  <div v-if="layout && !excluded.includes(String(layout))" class="govuk-page-number gov-page-float">
    <SlideCurrentNo />
  </div>
</template>

<style scoped>
.gov-page-float {
  position: absolute;
  right: 1.6rem;
  bottom: 0.8rem;
  font-size: 1rem;
}
</style>
