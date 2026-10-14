<script setup lang="ts">
// dd layout — a Don't/Do pair slide. Band title (≤4 words) + the pair.
// No lead: the pair IS the focal point. Frontmatter: title, kicker, bandColor
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'

const {$frontmatter} = useSlideContext()
const bandClass = computed(() => `gov-band gov-band--${$frontmatter.bandColor || 'blue'}`)
</script>

<template>
  <div class="slidev-layout dd-slide" style="height: 100%;">
    <header v-if="$frontmatter.title" :class="bandClass" class="gov-band">
      <div v-if="$frontmatter.kicker" class="gov-band-kicker">{{ $frontmatter.kicker }}</div>
      <h1 class="gov-band-title">{{ $frontmatter.title }}</h1>
    </header>
    <div class="dd-body-wrap">
      <slot />
    </div>
  </div>
</template>

<style>
.dd-slide { display: flex; flex-direction: column; }
.dd-body-wrap { flex: 1; min-height: 0; padding: 0.9rem 2.2rem 1rem; }
</style>
