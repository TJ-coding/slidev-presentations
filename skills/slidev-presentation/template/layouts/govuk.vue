<script setup lang="ts">
// GOV.UK content layout.
// Reading order (enforced by this layout):
//   1. black band title      — frontmatter `title`
//   2. the takeaway/lead     — frontmatter `lead`
//   3. the evidence (body)   — default slot
//   4. secondary material    — `#aside` slot
// Frontmatter: title, kicker, bandColor, lead
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
    <div class="gov-body" :class="{ 'gov-body--centered': $frontmatter.centered }">
      <h2 v-if="lead" class="govuk-lead" v-html="lead" />

      <slot />

      <div v-if="$slots.aside" class="govuk-aside">
        <slot name="aside" />
      </div>
    </div>
  </div>
</template>

<style>
/* Band styles are global because other layouts reuse them.
   Quiet theme: white band, ink title, accent kicker, hairline rule.
   bandColor: maps to a 6px left edge (inset shadow, no layout shift). */
.gov-band {
  background: var(--deck-band);
  padding: 1.1rem 2.4rem;
  min-height: 4rem;
}
.gov-band--black { background: var(--navy); }
.gov-band--blue { background: var(--navy); }
.gov-band--green { background: var(--sage); }
.gov-band--red { background: var(--crimson); }
.gov-band-kicker {
  color: #ffffff;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  opacity: 0.85;
  margin-bottom: 0.2rem;
}
.gov-band-title {
  color: #fff !important;
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.15;
  margin: 0 !important;
}
.gov-body {
  padding: 1.6rem 2.4rem 2.2rem;
}
.gov-body--centered {
  height: calc(100% - 7rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
