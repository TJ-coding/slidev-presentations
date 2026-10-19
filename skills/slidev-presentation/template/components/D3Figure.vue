<script setup lang="ts">
// D3Figure — a LIVE, animated D3 figure mounted BY REFERENCE on a slide,
// with its stages driven by the slide's own →/← clicks.
//
//   → press  : plays the next stage (animated)
//   ← press  : plays the current stage BACKWARDS (mirrored stagger)
//   resync   : deep links, HMR remounts and multi-click jumps fall back to an
//              instant jumpTo(n) — the figure renders stages 1..n exactly
//   print/PDF: the settled-frame PNG is swapped in via @media print
//
// The figure script is a CLASSIC (non-module) script that exposes
//   window.<global> = { mount(container, opts?) -> controller }
// with the embedder contract of references/d3-live-figures.md
// (steps: 'clicks'; controller = next/prev/jumpTo/stage/cleanup).
// Assets are served through a symlink public/diagrams → ../../diagrams/<slug>,
// so edits in the figure's source directory propagate live — never copy files.
//
// Required slide frontmatter: `clicks: N` where N = number of stages − 1.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSlideContext } from '@slidev/client'   // root import — the @slidev/client/context subpath breaks vite pre-transform

const props = defineProps<{
  /** figure script URL under public/, e.g. '/diagrams/motivation-figure.js' */
  script: string
  /** window key exposing { mount }, e.g. 'MotivationFigure' */
  global: string
  /** d3 build URL (default '/diagrams/d3.min.js') */
  d3?: string
  /** settled-frame PNG for print/export fallback, e.g. '/diagrams/out/figure-static.png' */
  fallback?: string
  /** extra opts handed to mount() (theme flags, figure-specific toggles) */
  mountOpts?: Record<string, unknown>
  /** alt text for the live region and the print fallback */
  alt?: string
}>()

const { $clicks } = useSlideContext()
const el = ref<HTMLElement>()
const failed = ref(false)

interface FigureController {
  next: () => boolean
  prev: () => boolean
  jumpTo: (n: number) => void
  stage: () => number
  cleanup: () => void
}

// module-level load cache: several D3Figure instances (and HMR remounts)
// share one script load per URL
const loaded = new Map<string, Promise<void>>()
function loadScript(src: string): Promise<void> {
  let p = loaded.get(src)
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve()
      const s = document.createElement('script')
      s.src = src
      s.onload = () => resolve()
      s.onerror = () => { loaded.delete(src); reject(new Error(`Failed to load ${src}`)) }
      document.head.appendChild(s)
    })
    loaded.set(src, p)
  }
  return p
}
function ensureLoaded(): Promise<void> {
  return loadScript(props.d3 ?? '/diagrams/d3.min.js').then(() => loadScript(props.script))
}

function api(): { mount: (el: HTMLElement, opts?: Record<string, unknown>) => FigureController } | undefined {
  return (window as unknown as Record<string, undefined | { mount: (el: HTMLElement, opts?: Record<string, unknown>) => FigureController }>)[props.global]
}

let controller: FigureController | null = null

onMounted(async () => {
  try {
    await ensureLoaded()
    controller = api()!.mount(el.value!, { steps: 'clicks', ...props.mountOpts })
    // resync: deep link (?clicks=), HMR remount — render stages 1..clicks+1 instantly
    controller.jumpTo($clicks.value + 1)
  } catch {
    failed.value = true   // print fallback stays visible
  }
})

watch($clicks, (n, o) => {
  if (!controller) return
  if (n > o) {
    controller.next()                                            // → : play the next stage
    if (controller.stage() !== n + 1) controller.jumpTo(n + 1)   // multi-click jump: settle instantly
  }
  else if (n < o) {
    const played = controller.prev()                             // ← : play the stage backwards
    if (!played || controller.stage() !== n + 1) controller.jumpTo(n + 1)
  }
})

onBeforeUnmount(() => {
  controller?.cleanup()
  controller = null
})
</script>

<template>
  <div class="d3-figure" :class="{ 'd3-figure--failed': failed }">
    <div
      ref="el"
      class="live"
      role="img"
      :aria-label="alt || 'Animated figure — advance with the slide clicks'"
    ></div>
    <img
      v-if="fallback"
      class="print-fallback"
      :src="fallback"
      :alt="alt || 'Settled frame of the animated figure'"
    />
  </div>
</template>

<style scoped>
.d3-figure {
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.d3-figure :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
.print-fallback {
  display: none;
  width: 100%;
}
@media print {
  .d3-figure .live {
    display: none;
  }
  .d3-figure .print-fallback {
    display: block;
  }
}
</style>
