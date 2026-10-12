<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
// Adds a footer to every slide except cover/section/end layouts.
import DeckFooter from './components/DeckFooter.vue'

const { $slidev } = useSlideContext()
const excluded = ['cover', 'section', 'end', 'intro', 'thank-you']
const layout = $slidev.nav.currentLayout.value
</script>

<template>
  <DeckFooter v-if="layout && !excluded.includes(layout)" />
</template>
