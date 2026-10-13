<script setup lang="ts">
// GOV.UK cover: black phase band + kicker tag, big title, blue meta, grey author.
// Frontmatter: title, subtitle, kicker, author, meta
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'

const { $frontmatter } = useSlideContext()
const title = $frontmatter.title || ''
const subtitle = $frontmatter.subtitle
const kicker = $frontmatter.kicker
const author = $frontmatter.author
const meta = $frontmatter.meta
const accent = computed(() => `govuk-tag ${$frontmatter.tagColor ? 'govuk-tag--' + $frontmatter.tagColor : ''}`)
</script>

<template>
  <div class="slidev-layout govuk govuk-cover">
    <div class="gov-cover-band">
      <span v-if="kicker" :class="accent" class="govuk-tag govuk-tag--yellow">{{ kicker }}</span>
    </div>
    <div class="gov-cover-body">
      <h1 class="gov-cover-title">{{ title }}</h1>
      <p v-if="subtitle" class="gov-cover-subtitle">{{ subtitle }}</p>
      <p v-if="meta" class="gov-cover-meta">{{ meta }}</p>
      <p v-if="author" class="gov-cover-author">{{ author }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.govuk-cover {
  background: #fff;
  width: 100%;
  height: 100%;
}
.gov-cover-band {
  background: #0b0c0c;
  padding: 0.8rem 2.4rem;
  display: flex;
  align-items: center;
}
.gov-cover-body {
  padding: 3.5rem 3rem 0;
  text-align: center;
}
.gov-cover-title {
  font-size: 3.1rem;
  font-weight: 700;
  margin: 0 0 1.2rem !important;
  letter-spacing: -0.02em;
  /* Title Case on the cover, as in the reference decks.
     (CSS capitalises every word; write proper Title Case in the
     frontmatter `title:` if you want minor words lowercase) */
  text-transform: capitalize;
}
.gov-cover-subtitle {
  font-size: 1.5rem;
  color: var(--govuk-text);
  margin: 0 0 0.9rem;
}
.gov-cover-meta {
  font-size: 1.15rem;
  color: var(--govuk-link);
  font-weight: 700;
  margin: 0 0 1.6rem;
}
.gov-cover-author {
  font-size: 1.05rem;
  color: var(--govuk-secondary);
  margin: 0;
}
</style>
