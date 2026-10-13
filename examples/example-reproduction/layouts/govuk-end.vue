<script setup lang="ts">
// GOV.UK end slide: black band centered, thanks + contact
// Frontmatter: title, kicker, author
import { useSlideContext } from '@slidev/client'
</script>

<template>
  <div class="slidev-layout govuk">
    <div class="gov-body gov-end" :class="{ 'gov-body--centered': true }">
      <h1>{{ $frontmatter.title || 'Thanks' }}</h1>
      <p v-if="$frontmatter.kicker" class="gov-cover-meta gov-accent-link">{{ $frontmatter.kicker }}</p>
      <p v-if="$frontmatter.author" class="govuk-secondary-text">{{ $frontmatter.author }}</p>
      <slot />
    </div>
  </div>
</template>

<style>
.govuk-secondary-text { color: var(--govuk-secondary); }
.gov-accent-link { color: var(--govuk-link); font-weight: 700; }
</style>
