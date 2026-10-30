<script setup lang="ts">
// GovBox — filled label block (navy fill, white text).
// `inverted` flips it: white fill, navy text + navy outline.
// `label` accepts HTML and `$…$` / `$$…$$` LaTeX (typeset via KaTeX).
// `size` sets the text size: a number is an em multiplier of the inherited
// size (`1.2` = 120%), a string is any CSS length (`'0.8rem'`).
// Usages:
//   <GovBox label="Installed Cache" />
//   <GovBox inverted label="Installed Cache" />
//   <GovBox label="$$\mathbf{A} \in \mathbb{C}^{n \times n}$$" />
//   <GovBox label="Small print" size="0.8rem" />
import { computed } from 'vue'
import { typeset } from './math'
const props = defineProps<{ label?: string; inverted?: boolean; size?: string | number }>()
const style = computed(() =>
  props.size == null || props.size === ''
    ? undefined
    : { fontSize: typeof props.size === 'number' ? `${props.size}em` : props.size },
)
</script>

<template>
  <div class="gov-box" :class="{ 'gov-box--inverted': inverted }" :style="style">
    <slot><span v-if="label" v-html="typeset(label)"></span></slot>
  </div>
</template>
