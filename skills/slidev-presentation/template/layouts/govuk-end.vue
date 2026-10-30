<script setup lang="ts">
// GOV.UK end slide, mirroring the cover: navy band (thanks) + sage band
// (questions), then the talk title and author on white.
// Frontmatter: title, subtitle, kicker, author
import { useSlideContext } from '@slidev/client'
import { typeset } from '../components/math'

const { $frontmatter } = useSlideContext()
</script>

<template>
  <div class="slidev-layout govuk-end">
    <div class="gov-end-band">
      <h1 v-html="typeset($frontmatter.title || 'Thank you')" />
    </div>
    <div v-if="$frontmatter.subtitle" class="gov-end-subband" v-html="typeset($frontmatter.subtitle)" />
    <div class="gov-end-body">
      <p v-if="$frontmatter.kicker" class="gov-end-kicker">{{ $frontmatter.kicker }}</p>
      <p v-if="$frontmatter.author" class="gov-end-author">{{ $frontmatter.author }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.govuk-end {
  background: #fff;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.gov-end-band {
  background: var(--deck-band);
  padding: 2.2rem 2.4rem;
  text-align: center;
}
.gov-end-band h1 {
  color: #fff;
  font-size: 3.2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}
.gov-end-subband {
  background: var(--sage);
  color: #fff;
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  padding: 0.5rem 2.4rem;
}
.gov-end-body {
  padding: 2.2rem 3rem 0;
  text-align: center;
}
.gov-end-kicker {
  color: var(--navy);
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0 0 0.6rem;
}
.gov-end-author {
  color: var(--steel);
  font-size: 1.1rem;
  margin: 0;
}
</style>
