<script setup lang="ts">
// GOV.UK cover, mirroring the reference decks' title page:
//   1. navy band  — Title Case title (white, bold, can wrap to 2 lines)
//   2. sage band  — white bold subtitle
//   3. white body — name (navy), Japanese title (big, bold), grey meta lines
// Frontmatter: title, subtitle, name, jpTitle, meta (HTML allowed), author
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import { typeset } from '../components/math'

const { $frontmatter } = useSlideContext()
const title = computed(() => $frontmatter.title || '')
const subtitle = $frontmatter.subtitle
const name = $frontmatter.name
const jpTitle = $frontmatter.jpTitle
const meta = $frontmatter.meta
const author = $frontmatter.author
</script>

<template>
  <div class="slidev-layout govuk-cover">
    <div class="gov-cover-band">
      <h1 class="cover-band-title" v-html="typeset(title)" />
    </div>
    <div v-if="subtitle" class="gov-cover-subband" v-html="typeset(subtitle)" />
    <div class="gov-cover-body">
      <p v-if="name" class="gov-cover-name">{{ name }}</p>
      <p v-if="jpTitle" class="gov-cover-jp">{{ jpTitle }}</p>
      <div class="gov-cover-meta-block">
        <p v-if="meta" class="gov-cover-meta" v-html="meta"></p>
        <p v-if="author" class="gov-cover-author">{{ author }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.govuk-cover {
  background: #fff;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.gov-cover-band {
  background: var(--deck-band);
  padding: 1.6rem 2.4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
}
.cover-band-title {
  color: #fff;
  font-size: 2.7rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0;
  text-align: center;
  max-width: 90%;
}
.gov-cover-subband {
  background: var(--sage);
  color: #fff;
  font-size: 1.45rem;
  font-weight: 700;
  text-align: center;
  padding: 0.45rem 2.4rem;
}
.gov-cover-body {
  flex: 1;
  padding: 2.6rem 3rem 2.2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.gov-cover-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--navy);
  margin: 0 0 1.6rem;
}
.gov-cover-jp {
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: 0.02em;
  margin: 0 0 2.6rem;
}
.gov-cover-meta-block {
  margin-top: auto;
}
.gov-cover-meta {
  font-size: 1.1rem;
  line-height: 1.55;
  color: var(--steel);
  margin: 0;
}
.gov-cover-author {
  font-size: 1.1rem;
  line-height: 1.55;
  color: var(--steel);
  margin: 0;
}
</style>
