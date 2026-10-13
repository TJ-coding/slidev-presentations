<script setup lang="ts">
// GOV.UK section divider: black (or image) full-bleed, big white title.
// Frontmatter: title, kicker, image (optional full-bleed photo)
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import { resolveAssetUrl } from '@slidev/client'

const { $frontmatter } = useSlideContext()
const image = computed(() => {
  const u = $frontmatter.image
  return u ? resolveAssetUrl(u) : null
})
</script>

<template>
  <div class="slidev-layout govuk-section" :style="image ? { background: `linear-gradient(rgba(11,12,12,0.55), rgba(11,12,12,0.75)), url('${image}') center/cover` } : {}">
    <span v-if="$frontmatter.kicker" class="govuk-tag govuk-tag--yellow">{{ $frontmatter.kicker }}</span>
    <h1 class="gov-section-title">{{ $frontmatter.title }}</h1>
    <slot />
  </div>
</template>

<style scoped>
.govuk-section {
  background: #0b0c0c;
  color: #fff;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 3.5rem;
  text-align: center;
}
.gov-section-title {
  color: #fff !important;
  font-size: 3rem;
  font-weight: 700;
  margin: 1.4rem 0 0 !important;
  line-height: 1.1;
}
.govuk-tag { margin-bottom: 0.6rem; }
.govuk-section :deep(p) { color: #f3f2f1 !important; }
.govuk-section :deep(a) { color: var(--govuk-yellow) !important; }
</style>

<style>
/* tag modifiers reused across layouts */
.govuk-tag--yellow { background: var(--govuk-yellow) !important; color: var(--govuk-text) !important; }
.govuk-tag--green { background: var(--govuk-green) !important; }
.govuk-tag--red { background: var(--govuk-red) !important; }
.govuk-tag--grey { background: var(--govuk-secondary) !important; }
</style>
