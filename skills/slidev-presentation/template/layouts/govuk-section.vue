<script setup lang="ts">
// GOV.UK section divider, mirroring the reference decks: full-bleed navy,
// big white title (lower-left) with a grey subtitle, and a progress rail of
// ALL sections (right edge) showing where we are in the talk.
// Frontmatter: title, subtitle, kicker (1-based section number),
// sections (list of all section names, shown in the rail)
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import { typeset } from '../components/math'

const { $frontmatter } = useSlideContext()
const sections = computed(() => (Array.isArray($frontmatter.sections) ? $frontmatter.sections : []))
const current = computed(() => {
  const k = parseInt(String($frontmatter.kicker ?? ''), 10)
  return Number.isNaN(k) ? -1 : k - 1
})
</script>

<template>
  <div class="slidev-layout govuk-section">
    <div class="gov-section-main">
      <h1 class="gov-section-title" v-html="typeset($frontmatter.title)" />
      <p v-if="$frontmatter.subtitle" class="gov-section-subtitle" v-html="typeset($frontmatter.subtitle)" />
    </div>
    <ol v-if="sections.length" class="gov-section-rail">
      <li
        v-for="(s, i) in sections"
        :key="s"
        :class="{ 'is-current': i === current, 'is-past': i < current }"
      >
        <span class="gov-section-rail-n">{{ i + 1 }}</span>{{ s }}
      </li>
    </ol>
    <slot />
  </div>
</template>

<style scoped>
.gov-section-main {
  /* keep long titles clear of the section rail on the right */
  max-width: calc(100% - 20rem);
}
.govuk-section {
  background: var(--navy);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0 4rem 4.5rem;
  position: relative;
}
.gov-section-title {
  color: #fff !important;
  font-size: 3.2rem;
  font-weight: 600;
  margin: 0 !important;
  line-height: 1.1;
}
.gov-section-subtitle {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.9rem 0 0;
}
.gov-section-rail {
  position: absolute;
  right: 4rem;
  bottom: 4.5rem;
  list-style: none !important;
  margin: 0;
  padding: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.gov-section-rail li {
  list-style: none !important;
  color: rgba(255, 255, 255, 0.38);
  font-size: 1.05rem;
  font-weight: 600;
  white-space: nowrap;
}
.gov-section-rail li::marker { content: none !important; }
.gov-section-rail li.is-past { color: rgba(255, 255, 255, 0.55); }
.gov-section-rail li.is-current {
  color: #fff;
  font-weight: 700;
}
.gov-section-rail li.is-current::before {
  content: "";
  display: inline-block;
  width: 0.85rem;
  height: 0.85rem;
  background: var(--sage);
  margin-right: 0.55rem;
}
.gov-section-rail-n {
  display: inline-block;
  min-width: 1.6rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.govuk-section :deep(a) { color: var(--sage) !important; }
</style>
