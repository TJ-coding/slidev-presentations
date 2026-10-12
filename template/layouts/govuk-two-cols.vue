<script setup lang="ts">
// GOV.UK two-columns: black band (frontmatter: title, kicker, bandColor)
// + left default slot and right `::right::` slot.
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

const {$frontmatter} = useSlideContext()
const bandClass = computed(() => `gov-band gov-band--${$frontmatter.bandColor || 'black'}`)
</script>

<template>
  <div class="slidev-layout govuk">
    <header v-if="$frontmatter.title" :class="bandClass" class="gov-band">
      <div v-if="$frontmatter.kicker" class="gov-band-kicker">{{ $frontmatter.kicker }}</div>
      <h1 class="gov-band-title">{{ $frontmatter.title }}</h1>
    </header>
    <div class="gov-body gov-two">
      <div>
        <slot />
      </div>
      <div>
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gov-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}
</style>
