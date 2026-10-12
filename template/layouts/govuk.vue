<script setup lang="ts">
// GOV.UK-style content layout: black title band + body.
// Frontmatter: title, kicker (small white text above title),
// bandColor ('black'|'blue'|'green'|'red'), centered (bool)
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'

const { $frontmatter } = useSlideContext()
const title = $frontmatter.title
const kicker = $frontmatter.kicker
const style = computed(() => `gov-band gov-band--${$frontmatter.bandColor || 'black'}`)
</script>

<template>
  <div class="slidev-layout govuk">
    <header v-if="title" :class="style" class="gov-band">
      <div v-if="kicker" class="gov-band-kicker">{{ kicker }}</div>
      <h1 class="gov-band-title">{{ title }}</h1>
    </header>
    <div class="gov-body" :class="{ 'gov-body--centered': $frontmatter.centered }">
      <slot />
    </div>
  </div>
</template>

<style>
/* Band styles are global because other layouts reuse them */
.gov-band {
  background: var(--deck-band);
  padding: 1.1rem 2.4rem;
  min-height: 4.2rem;
}
.gov-band--black { background: #0b0c0c; }
.gov-band--blue { background: #1d70b8; }
.gov-band--green { background: var(--govuk-green); }
.gov-band--red { background: var(--govuk-red); }
.gov-band-kicker {
  color: #f3f2f1;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.2rem;
  opacity: 0.8;
}
.gov-band-title {
  color: #fff !important;
  font-size: 2.05rem;
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
