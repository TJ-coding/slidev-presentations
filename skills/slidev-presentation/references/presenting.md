# Presenter mode, audience windows and multi-tab sync

How navigation stays in step between the presenter window, the audience window
and extra tabs — and what to do when it doesn't. Built and verified in the
acl26 talk (Slidev 53); the template ships the fix as `template/setup/main.ts`.

If the slide NUMBER is in step but a FIGURE looks different between windows, the
problem is in the figure, not here — see `d3-live-figures.md` (laws 4 and 5).

## What stock Slidev does (and why it breaks)

Two independent mechanisms exist, both dev and build:

- **Dev server** (`server-reactive:nav` websocket): the server holds the shared
  nav state and broadcasts patches to every connected window.
- **Static build**: a `BroadcastChannel` named `"<deck title> - shared"` inside
  one browser.

Both apply the same rule (`@slidev/client/setup/root.ts`): a window ignores any
patch whose `lastUpdate.type` equals its own sync type (`viewer` or
`presenter`). Consequences:

1. **Viewer ↔ viewer never syncs.** Two audience tabs only follow each other if
   a presenter window is open to relay. With no presenter (e.g. a second
   projector window, or a phone controlling the slide), clicks in one tab do
   nothing anywhere else. Verified: two windows at `/4?clicks=1`, one click
   each, both stay at 1.
2. **The viewer echo can lose or rewind clicks.** A viewer applies a
   presenter-driven patch and, because `viewerSend` defaults to `true`,
   re-stamps the state with a fresh timestamp and posts it back. If that window
   is busy (a D3 stage animation) or CPU-throttled, the echo arrives AFTER a
   newer presenter action and overwrites it. Reproduced with an 8×-throttled
   audience: 2 of 6 trials lost the second rapid click; one trial bounced back a
   slide. Symptoms: "the second click didn't register", "it jumped back",
   "presenter and audience show different clicks".

Neither is a figure problem: the figure faithfully renders whatever `$clicks`
it receives.

## The fix — `setup/main.ts` (shipped in the template)

```
<deck>/setup/main.ts        Slidev auto-loads setup/*.ts in every window
```

The template file is copied by `new-deck.sh`; copy it into any existing deck.
It does four things:

1. **Server flow is strictly one-way.** `viewerSend = false` (viewers receive,
   never post), `presenterSend = true`, `presenterReceive = true`. No viewer
   echo, so the click-loss race is gone.
2. **A same-origin `BroadcastChannel` bus** (`slidev-local-nav`) carries every
   window's navigation to every other window, including viewer → viewer. Any
   window that moves broadcasts `{ page, clicks, time }`.
3. **The presenter relays.** When the presenter receives a nav message it
   applies it; its own patch then goes to the server, so remote viewers follow
   viewer-initiated navigation too.
4. **Late joiners adopt the live position.** A new window posts `hello`; peers
   reply with their current position (`nav`), so a tab opened mid-talk joins
   the show. Only if nobody answers (first window of the session) does it fall
   back to the server state, and only from the deck entry (`/`, `/1`,
   `/index.html`) — explicit deep links like `/7?clicks=2` are intentional and
   are left alone. Print mode and the notes viewer are excluded.

Handshake window is 250 ms; during it a window does not broadcast its own nav
(so greetings can't bounce the show around).

### Why not just flip `viewerSend` off?

That alone fixes the echo but leaves viewer↔viewer broken (no relay when the
presenter is closed or is a different machine). The local bus plus a one-way
server flow covers both without inventing a second remote protocol.

### Pitfalls in the setup file itself

- Import the directions from `@slidev/client/state/storage.ts` — the explicit
  `.ts` extension is required; the extensionless subpath fails Vite's exports
  resolution.
- Call `useNav()` only AFTER `router.isReady()` (or inside handlers that run
  after it). It is a shared singleton; on the very first tick the router is not
  initialised yet and the nav built there stays broken for the whole session.
  The template expresses this as `router.afterEach(...)` (fires only after the
  router exists) plus the `isReady()` gate for the handshake.
- `router.afterEach` also fires for the initial route resolution; the `ready`
  guard keeps that from broadcasting.

## Operational rules for a talk

- **One dev server per deck.** Two Slidev instances on different ports are two
  different origins and two different servers — sync can't work across them.
  Check `lsof -ti :3030` before starting; `scripts/serve.sh` starts on :3030.
- **One origin for all windows.** Open the audience, presenter and any extra
  tab from the same host (`localhost` vs `127.0.0.1` are different origins:
  the local bus is silent between them).
- **Restart the dev server after editing `setup/main.ts`** (and reload all
  windows). Vite reloads setup files, but the sync directions are process-wide
  singletons — a clean restart removes any doubt.
- **Don't use the toolbar's sync toggle to re-enable viewer sending** during a
  show; the setup forces the safe directions on load, but a manual toggle
  changes them for that session.
- **Close extra tabs you don't need.** Every open window plays its own
  animations; a throttled background tab is the environment where races show
  up first.
- **The presenter window is the bridge to remote viewers.** Local tabs sync
  without it; remote viewers (another machine on the dev server) only get
  viewer-initiated navigation while a presenter window is open to relay.
- **`Failed to patch FloatingVue … reading 'Popper'` in the console is
  benign** (a twoslash/theme warning while a slide opens). It is unrelated to
  sync; don't chase it.

## Verification — `scripts/check-sync.mjs`

Run against a live dev server, from a deck directory (needs its
`playwright-chromium` devDependency), after adding or changing the setup:

```bash
node <kit>/scripts/check-sync.mjs http://localhost:3030/<slide>
```

The script pins every window to `<slide>` and checks, in order:

1. presenter pin → both audience tabs follow (server → viewer flow),
2. presenter click → both tabs follow,
3. tab click → presenter and the other tab follow (bus + relay),
4. two rapid presenter clicks with one tab CPU-throttled 8× → all windows at
   2 clicks (the echo race),
5. a tab opened mid-talk at `/` adopts the live page and clicks,
6. two tabs with no presenter → clicks in one apply in the other (the case stock
   Slidev cannot do).

Exit 0 means all passed; each FAIL line names the layer. If every check fails
at "no state", the script is pointed at a page without `window.__slidev__`
(build preview or wrong URL) — use the dev server.

For the figure's own states run `scripts/drive-figure.mjs` in addition; the two
checks are complementary (slide-level sync vs. figure staging).
