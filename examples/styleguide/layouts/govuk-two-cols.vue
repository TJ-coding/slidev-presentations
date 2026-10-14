<script setup lang="ts">
// GOV.UK two-columns, with an enforced role for each column:
//   1. band title            — frontmatter `title`
//   2. lead/takeaway         — frontmatter `lead`
//   3. LEFT = the argument    (default slot — statements, findings)
//      RIGHT = the evidence   (`::right::` — numbers, figures, code)
// Use ONLY when the two things are related and the roles are clear;
// otherwise prefer `govuk` with a single flow.
// Frontmatter: title, kicker, lead, bandColor
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'

const {$frontmatter} = useSlideContext()
const bandClass = computed(() => `gov-band gov-band--${$frontmatter.bandColor || 'black'}`)
const lead = $frontmatter.lead
</script>

<template>
  <div class="slidev-layout govuk">
    <header v-if="$frontmatter.title" :class="bandClass" class="gov-band">
      <div v-if="$frontmatter.kicker" class="gov-band-kicker">{{ $frontmatter.kicker }}</div>
      <h1 class="gov-band-title">{{ $frontmatter.title }}</h1>
    </header>
    <div class="gov-body">
      <h2 v-if="lead" class="govuk-lead" v-html="lead" />
      <div class="gov-two">
        <div>
          <slot />
        </div>
        <div>
          <slot name="right" />
        </div>
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
