<script setup lang="ts">
// GOV.UK image-right: black band (frontmatter: title, kicker, bandColor)
// + text left (default slot), image right (frontmatter: image).
// Use `<slot name="right">` content instead of image if no image given;
// `<template #caption>` shows a caption under the image.
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import { resolveAssetUrl } from '@slidev/client'
import { typeset } from '../components/math'

const {$frontmatter} = useSlideContext()
const bandClass = computed(() => `gov-band gov-band--${$frontmatter.bandColor || 'black'}`)
const image = computed(() => $frontmatter.image ? resolveAssetUrl($frontmatter.image) : null)
</script>

<template>
  <div class="slidev-layout govuk">
    <header v-if="$frontmatter.title" :class="bandClass" class="gov-band">
      <div v-if="$frontmatter.kicker" class="gov-band-kicker">{{ $frontmatter.kicker }}</div>
      <h1 class="gov-band-title" v-html="typeset($frontmatter.title)" />
    </header>
    <div class="gov-body gov-img-right">
      <div class="gov-img-right-text">
        <slot />
      </div>
      <div class="gov-img-right-figure">
        <template v-if="image">
          <img :src="image" alt="" />
          <slot name="caption" />
        </template>
        <slot v-else name="right" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gov-img-right {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 2rem;
  align-items: center;
}
.gov-img-right-figure img {
  width: 100%;
  height: auto;
  border: 1px solid var(--govuk-border);
}
</style>
