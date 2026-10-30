<script setup lang="ts">
// Demo bridge, docs-site only (added by build_demo.py, never shipped in the
// template). Inside an iframe on the docs site it:
//  - reports { clicks, total } of the current slide to the parent page,
//  - obeys { slidevDemoCmd: 'next' | 'prev' | 'reset' } messages,
//  - pins the iframe to its own slide: keys never leave the slide.
import { onBeforeUnmount, watch } from 'vue'
import { useNav } from '@slidev/client'

const nav = useNav()
const inFrame = window.parent !== window

function post() {
  if (!inFrame) return
  window.parent.postMessage({ slidevDemo: true, clicks: nav.clicks.value, total: nav.clicksTotal.value }, '*')
}
watch([nav.clicks, nav.clicksTotal, nav.currentSlideNo], post, { immediate: true })

function onMessage(e: MessageEvent) {
  const cmd = e.data?.slidevDemoCmd
  if (cmd === 'next' && nav.clicks.value < nav.clicksTotal.value) nav.next()
  else if (cmd === 'prev' && nav.clicks.value > 0) nav.prev()
  else if (cmd === 'reset') nav.go(nav.currentSlideNo.value, 0)
  else if (cmd === 'hello') post()
}

const FWD = new Set(['ArrowRight', ' ', 'PageDown', 'Enter'])
const BACK = new Set(['ArrowLeft', 'PageUp', 'Backspace'])
function onKey(e: KeyboardEvent) {
  const atEnd = nav.clicks.value >= nav.clicksTotal.value
  const atStart = nav.clicks.value <= 0
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || (FWD.has(e.key) && atEnd) || (BACK.has(e.key) && atStart)) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}

if (inFrame) {
  document.documentElement.classList.add('demo-embed')
  window.addEventListener('message', onMessage)
  window.addEventListener('keydown', onKey, { capture: true })
}
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  window.removeEventListener('keydown', onKey, { capture: true })
})
</script>

<template><span /></template>

<style>
/* the docs page draws its own controls; hide Slidev's nav bar in the frame */
html.demo-embed .slidev-nav-controls-wrapper,
html.demo-embed #slidev-goto-dialog,
html.demo-embed .gov-page-float { display: none !important; }
</style>
