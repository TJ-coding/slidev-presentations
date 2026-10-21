import type { AppContext } from '@slidev/types'
import { sharedState, useNav } from '@slidev/client'
import { syncDirections } from '@slidev/client/state/storage.ts'

// Sync hardening for the live-talk setup.
//
// Slidev's built-in sync is one-way per writer: a window ignores patches of its
// own type, so two audience tabs never follow each other (only a presenter
// relays viewer patches), and a viewer echo of presenter-driven navigation —
// re-stamped with a fresh timestamp and delayed by a busy (D3 animation) or
// throttled window — can overwrite newer state, making clicks snap back or get
// lost.
//
// Fix: keep the server flow strictly one-way (presenter → viewers, so viewers
// never echo) and add a same-origin BroadcastChannel bus on top. Any window's
// navigation reaches every other window; the presenter relays it to the server
// so remote viewers follow as well. A 'hello'/'nav' handshake answers a fresh
// window with the live position, so a tab opened mid-talk joins the others;
// the server state is only used to seed a window that nobody answered.

const CHANNEL = 'slidev-local-nav'
const id = Math.random().toString(36).slice(2)

interface NavMsg {
  id: string
  kind: 'nav' | 'hello'
  page?: number
  clicks?: number
  time?: number
}

export default function setup({ router }: AppContext) {
  syncDirections.value.viewerSend = false
  syncDirections.value.viewerReceive = true
  syncDirections.value.presenterSend = true
  syncDirections.value.presenterReceive = true

  let ready = false
  let handshaking = false
  let peerHeard = false
  let lastApplied = 0

  let channel: BroadcastChannel | undefined
  try {
    channel = new BroadcastChannel(CHANNEL)
  }
  catch {
    // no BroadcastChannel: the server flow (presenter → viewers) still works
  }

  function usable() {
    const nav = useNav()
    return !nav.isPrintMode.value && !nav.isNotesViewer.value
  }

  function post(kind: NavMsg['kind'], force = false) {
    if (!channel || !ready || (handshaking && !force) || !usable())
      return
    const nav = useNav()
    const time = Date.now()
    lastApplied = Math.max(lastApplied, time)
    channel.postMessage({ id, kind, page: nav.currentSlideNo.value, clicks: nav.clicks.value, time } satisfies NavMsg)
  }

  router.afterEach(() => post('nav'))

  channel?.addEventListener('message', (event: MessageEvent<NavMsg>) => {
    const msg = event.data
    if (!ready || !msg || msg.id === id || !usable())
      return
    if (msg.kind === 'hello') {
      post('nav', true)
      return
    }
    if (!msg.page)
      return
    peerHeard = true
    if ((msg.time ?? 0) <= lastApplied)
      return
    lastApplied = msg.time!
    const nav = useNav()
    if (nav.currentSlideNo.value !== msg.page || nav.clicks.value !== (msg.clicks ?? 0))
      nav.go(msg.page, msg.clicks ?? 0)
  })

  router.isReady().then(async () => {
    ready = true
    handshaking = true
    channel?.postMessage({ id, kind: 'hello' } satisfies NavMsg)
    await new Promise(resolve => setTimeout(resolve, 250))
    const nav = useNav()
    // nobody on this machine knows where the show is: fall back to the server
    // state, but only from the deck entry (explicit deep links are intentional)
    const entering = ['/', '/1', '/index.html'].includes(router.currentRoute.value.path)
    if (!peerHeard && !nav.isPresenter.value && entering && usable()) {
      const { page, clicks } = sharedState
      if (page && (nav.currentSlideNo.value !== page || nav.clicks.value !== clicks))
        await nav.go(page, clicks)
    }
    handshaking = false
  })
}
