<script setup lang="ts">
// GovBox — filled label block (navy fill, white text).
// `inverted` flips it: white fill, navy text + navy outline.
// `label` accepts HTML and `$…$` / `$$…$$` LaTeX (typeset via KaTeX).
// Usages:
//   <GovBox label="Installed Cache" />
//   <GovBox inverted label="Installed Cache" />
//   <GovBox label="$$\mathbf{A} \in \mathbb{C}^{n \times n}$$" />
import { typeset } from './math'
defineProps<{ label?: string; inverted?: boolean }>()
</script>

<template>
  <div class="gov-box" :class="{ 'gov-box--inverted': inverted }">
    <slot><span v-if="label" v-html="typeset(label)"></span></slot>
  </div>
</template>
