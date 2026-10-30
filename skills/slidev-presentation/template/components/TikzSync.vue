<script setup lang="ts">
// TikzSync — inline an animated TikZ SVG and drive its SMIL clock from the
// slide's click counter, so a diagram stays in lockstep with GovDerivation.
//
// The SVG is produced at build time by scripts/build-tikz.mjs (node-tikzjax),
// which preserves the TikZ `animations` library's <animate> timelines. The
// component pauses the SVG's own clock and seeks it to the time mapped to
// `$clicks`; no v-click elements are registered, so the derivation keeps its
// click budget.
//
// Usage (SVG in <deck>/tikz/<name>.svg, TikZ source in tikz/src — see
// tikz/src/README.md; wrap in .tikz-inset to sit it above a derivation):
//   <TikzSync name="example-chain" :at="[0, 1.2, 2.4]" />
//   <TikzSync name="foo" :step-seconds="1.2" :duration="400" />
//   <TikzSync name="foo" outline />
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'

const props = withDefaults(defineProps<{
  /** basename of the compiled SVG in <deck>/tikz/ (no extension) */
  name: string
  /** timeline seconds for each click index; last value clamps */
  at?: number[]
  /** seconds per click when `at` is omitted */
  stepSeconds?: number
  /** seek tween in ms; 0 = snap */
  duration?: number
  /** draw a thin frame around the diagram */
  outline?: boolean
  /** hide the diagram once the slide reaches this click index */
  hideAt?: number
  alt?: string
}>(), {
  stepSeconds: 1.2,
  duration: 650,
})

const files = import.meta.glob('../tikz/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const raw = computed(() => files[`../tikz/${props.name}.svg`] ?? '')

const { $clicks, $renderContext } = useSlideContext()
const hidden = computed(() => props.hideAt != null && $clicks.value >= props.hideAt)
const host = ref<HTMLElement>()
const svgEl = ref<SVGSVGElement>()
const instanceId = `tikz-${Math.random().toString(36).slice(2, 8)}`
let raf = 0

function timeForClick(n: number): number {
  if (props.at?.length) {
    const i = Math.min(Math.max(n, 0), props.at.length - 1)
    return props.at[i]
  }
  return Math.max(0, n) * props.stepSeconds
}

// Inline SVGs share ids across presenter/audience copies. Without a suffix,
// every copy's <animate xlink:href="#…"> resolves to the first copy.
function namespaceIds(root: SVGSVGElement) {
  const ids = new Map<string, string>()
  for (const el of root.querySelectorAll('[id]')) {
    const next = `${el.id}-${instanceId}`
    ids.set(el.id, next)
    el.id = next
  }
  const fix = (value: string) => value
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${ids.get(id) ?? id})`)
    .replace(/^#(.+)$/, (_, id: string) => `#${ids.get(id) ?? id}`)
  for (const el of root.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      if (attr.name === 'id' || !attr.value.includes('#')) continue
      const next = fix(attr.value)
      if (next !== attr.value) el.setAttribute(attr.name, next)
    }
  }
}

function snap(t: number) {
  cancelAnimationFrame(raf)
  raf = 0
  svgEl.value?.setCurrentTime(Math.max(0, t))
}

function seek(t: number, instant = false) {
  const svg = svgEl.value
  if (!svg) return
  const target = Math.max(0, t)
  const preview = !['slide', 'presenter'].includes($renderContext.value)
  if (instant || preview || props.duration <= 0) return snap(target)

  cancelAnimationFrame(raf)
  const from = svg.getCurrentTime()
  if (Math.abs(target - from) < 0.001) return
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / props.duration)
    const eased = 1 - (1 - p) ** 3
    svg.setCurrentTime(from + (target - from) * eased)
    raf = p < 1 ? requestAnimationFrame(tick) : 0
  }
  raf = requestAnimationFrame(tick)
}

onMounted(async () => {
  await nextTick()
  const svg = host.value?.querySelector('svg')
  if (!svg) return
  svgEl.value = svg
  namespaceIds(svg)
  svg.pauseAnimations()
  snap(timeForClick($clicks.value))
})

watch($clicks, (n, old) => {
  const jumped = Math.abs(n - old) > 1
  seek(timeForClick(n), jumped)
})

function resync() {
  if (raf) return
  snap(timeForClick($clicks.value))
}

window.addEventListener('focus', resync)
document.addEventListener('visibilitychange', resync)
window.addEventListener('beforeprint', resync)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('focus', resync)
  document.removeEventListener('visibilitychange', resync)
  window.removeEventListener('beforeprint', resync)
})
</script>

<template>
  <div
    ref="host"
    class="tikz-sync"
    :class="{ 'tikz-sync--outline': outline, 'tikz-sync--hidden': hidden }"
    role="img"
    :aria-label="alt || 'Animated TikZ diagram'"
    v-html="raw"
  />
</template>

<style scoped>
.tikz-sync {
  line-height: 0;
  box-sizing: border-box;
  transition: opacity 300ms ease;
}
.tikz-sync--hidden {
  opacity: 0;
}
.tikz-sync--outline {
  padding: 0.4rem;
  border: 1px solid var(--navy);
  border-radius: 0.35rem;
  background: #fff;
}
.tikz-sync :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
