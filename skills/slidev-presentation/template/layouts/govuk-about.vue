<script setup lang="ts">
// GOV.UK about-me (self-introduction), mirroring the reference decks:
// full-bleed photo left, navy panel right with an underlined white title
// and a short bullet list.
// Frontmatter: image, title (default 'About Me')
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import { resolveAssetUrl } from '@slidev/client'
import { typeset } from '../components/math'

const { $frontmatter } = useSlideContext()
const image = computed(() => ($frontmatter.image ? resolveAssetUrl($frontmatter.image) : null))
</script>

<template>
  <div class="slidev-layout govuk-about">
    <div v-if="image" class="gov-about-photo" :style="{ backgroundImage: `url('${image}')` }" />
    <div class="gov-about-panel">
      <h1 class="gov-about-title" v-html="typeset($frontmatter.title || 'About Me')" />
      <div class="gov-about-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.govuk-about {
  display: grid;
  grid-template-columns: 11fr 9fr;
  width: 100%;
  height: 100%;
  background: var(--navy);
}
.gov-about-photo {
  background-size: cover;
  background-position: center;
}
.gov-about-panel {
  color: #fff;
  padding: 2.6rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.gov-about-title {
  color: #fff !important;
  font-size: 2.4rem;
  font-weight: 600;
  text-align: right;
  text-decoration: underline;
  text-underline-offset: 0.3em;
  text-decoration-thickness: 2px;
  margin: 0 0 2rem;
}
.gov-about-body {
  font-size: 1.2rem;
  line-height: 1.6;
}
.gov-about-body :deep(ul) {
  list-style: disc;
  padding-left: 1.2em;
  margin: 0;
}
.gov-about-body :deep(li) {
  color: #fff;
  margin: 0.55rem 0;
}
.gov-about-body :deep(li)::marker {
  color: #fff;
}
.gov-about-body :deep(strong) {
  color: #fff;
}
.gov-about-body :deep(.accent-amber) {
  color: #f59e0b;
  font-weight: 700;
}
</style>
