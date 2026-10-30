<script setup lang="ts">
// GovWindow — a floating pop-up window with chrome: title bar, body, footer.
// Pops in on click (fade + scale/translate); `overlay` dims the slide behind
// it. Use for a result, quote, screenshot or aside that should feel layered
// above the page.
// `title`, `body` and `footer` accept HTML and `$…$` / `$$…$$` LaTeX.
// Usage:
//   <GovWindow title="Search result">410 → 40 ms</GovWindow>
//   <GovWindow title="Caveat" tone="red" overlay>
//     The cross-encoder still scores every pair.
//   </GovWindow>
//   <GovWindow title="Result" width="34rem">
//     <template #footer>Source: internal benchmark</template>
//   </GovWindow>
import { computed } from 'vue'
import { typeset } from './math'

const props = withDefaults(defineProps<{
  /** title shown in the chrome bar (HTML / LaTeX) */
  title?: string
  /** body text (HTML / LaTeX); the default slot overrides it */
  body?: string
  /** bar colour */
  tone?: 'navy' | 'green' | 'red'
  /** CSS width of the window (default 30rem) */
  width?: string
  /** dim the slide behind the window (default false) */
  overlay?: boolean
  /** show the close glyph (default true; purely decorative) */
  closable?: boolean
  /** footer text (HTML / LaTeX); the #footer slot overrides it */
  footer?: string
}>(), {
  tone: 'navy',
  width: '30rem',
  overlay: false,
  closable: true,
})

const toneClass = computed(() => `gov-window--${props.tone}`)
</script>

<template>
  <div v-click class="gov-window-layer" :class="{ 'gov-window-layer--overlay': overlay }">
    <div v-if="overlay" class="gov-window-backdrop" aria-hidden="true"></div>
    <section
      class="gov-window"
      :class="toneClass"
      :style="{ '--gw-width': width ?? '30rem' }"
      role="dialog"
      :aria-modal="overlay ? 'true' : undefined"
      :aria-label="title"
    >
      <header class="gov-window-bar">
        <span class="gov-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="gov-window-title">
          <slot name="title"><span v-if="title" v-html="typeset(title)"></span></slot>
        </span>
        <span v-if="closable !== false" class="gov-window-close" aria-hidden="true">×</span>
      </header>
      <div class="gov-window-body">
        <slot><span v-if="body" v-html="typeset(body)"></span></slot>
      </div>
      <footer v-if="$slots.footer || footer" class="gov-window-footer">
        <slot name="footer"><span v-html="typeset(footer ?? '')"></span></slot>
      </footer>
    </section>
  </div>
</template>
