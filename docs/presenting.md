---
title: Presenting & sync
nav_order: 7
---

# Presenting and sync

How navigation stays in step between the presenter window, the audience window
and extra tabs, what the kit's `setup/main.ts` changes, and how to check it.
Verified with Slidev 53.

If the slide number is in step but a **figure** looks different between windows,
the problem is in the figure, not in sync. See the five laws in
[Animated figures](figures.html#the-figure-side-contract-snippetsd3-figure-embedderjs).

## What stock Slidev does, and why it breaks

Slidev has two sync mechanisms:

- **Dev server:** the server holds the shared navigation state and broadcasts
  patches over a websocket (`server-reactive:nav`) to every connected window.
- **Static build:** a `BroadcastChannel` named `"<deck title> - shared"` inside
  one browser.

Both apply one rule: a window ignores any patch whose `lastUpdate.type` equals
its own sync type (`viewer` or `presenter`). Two consequences:

1. **Viewer to viewer never syncs.** Two audience tabs follow each other only if
   a presenter window is open to relay. With no presenter (a second projector
   window, a phone remote), a click in one tab does nothing elsewhere.
2. **The viewer echo can lose or rewind clicks.** A viewer applies a
   presenter-driven patch and, because `viewerSend` defaults to `true`,
   re-stamps the state with a fresh timestamp and posts it back. If that window
   is busy (a D3 stage animation) or throttled, the echo arrives after a newer
   presenter action and overwrites it. Symptoms: "the second click didn't
   register", "it jumped back", "presenter and audience show different clicks".

## What `setup/main.ts` fixes

Slidev auto-loads `setup/*.ts` in every window. `new-deck.sh` copies the
template's `setup/main.ts` into each new deck; copy it into an existing deck by
hand. It does four things.

1. **One-way server flow.** It forces `viewerSend = false`, `viewerReceive =
   true`, `presenterSend = true`, `presenterReceive = true`. Viewers receive but
   never post, so no echo exists to overwrite newer state. (The directions come
   from `@slidev/client/state/storage.ts`.)
2. **A same-origin `BroadcastChannel` bus** named `slidev-local-nav`. Every
   window that navigates posts `{ id, kind: 'nav', page, clicks, time }`,
   triggered from `router.afterEach`. Other windows apply it with `nav.go(page,
   clicks)` when it differs from their own position and is newer than the last
   position they applied. This carries viewer to viewer navigation.
3. **The presenter relays.** The presenter applies bus messages, and its own
   patch then goes to the server, so remote viewers also follow
   viewer-initiated navigation.
4. **Late joiners adopt the live position.** A new window posts `hello` and
   waits 250 ms. Peers answer with a `nav` message, which the new window applies.
   Only if nobody answers (it is the first window) does it fall back to the
   server's shared state, and only when entering at `/`, `/1` or `/index.html`.
   An explicit deep link such as `/7?clicks=2` is left alone, and a presenter
   window never takes the server fallback. During the 250 ms handshake a window
   does not broadcast its own position, so greetings cannot bounce the show.

Print mode and the notes viewer are excluded entirely. If `BroadcastChannel` is
unavailable, the server flow (presenter to viewers) still works.

Why not just disable `viewerSend`? That fixes the echo but leaves viewer to
viewer broken whenever the presenter is closed or on another machine.

### Pitfalls if you edit the setup file

- Import from `@slidev/client/state/storage.ts` with the explicit `.ts`
  extension; the extensionless subpath fails Vite's exports resolution.
- Call `useNav()` only after `router.isReady()` or inside handlers that run
  after it. It is a shared singleton, and a nav created on the very first tick
  stays broken for the session. The template uses `router.afterEach` plus the
  `isReady()` gate for the handshake.
- `router.afterEach` also fires for the initial route resolution; the `ready`
  guard stops that from broadcasting.

## Operational rules for a talk

- **One dev server per deck.** Two Slidev instances on different ports are two
  origins and two servers, so sync cannot work across them. Check
  `lsof -ti :3030` first; `serve.sh` starts on :3030.
- **One origin for all windows.** Open audience, presenter and extra tabs from
  the same host. `localhost` and `127.0.0.1` are different origins, and the local
  bus is silent between them.
- **Restart the dev server after editing `setup/main.ts`**, then reload every
  window. The sync directions are process-wide singletons, and a clean restart
  removes doubt.
- **Do not re-enable viewer sending from the toolbar's sync toggle** during a
  show. The setup forces safe directions on load, but a manual toggle changes
  them for that session.
- **Close tabs you do not need.** Every open window plays its own animations, and
  a throttled background tab is where races appear first.
- **The presenter window is the bridge to remote viewers.** Local tabs sync
  without it, but viewers on another machine only get viewer-initiated
  navigation while a presenter window is open to relay.
- `Failed to patch FloatingVue ... reading 'Popper'` in the console is benign and
  unrelated to sync.

## Verifying: `check-sync.mjs`

Run it from the deck directory (it needs the deck's `playwright-chromium`
devDependency) against a running dev server, after adding or changing the setup
and before presenting live:

```sh
node <kit>/skills/slidev-presentation/scripts/check-sync.mjs http://localhost:3030/<slide>
```

Options:

| Argument | Default | Meaning |
|---|---|---|
| `<slide-url>` (required) | n/a | A slide on the dev server such as `http://localhost:3030/4`. The script reads the slide number from the last path segment (exit 2 if it cannot) and pins every window to it. Pick the first figure slide to cover the most. |
| `--timeout <ms>` | `6000` | Per-assertion wait. |
| `--throttle <n>` | `8` | CPU throttling rate for the slow-audience test. |

Environment: `DECK=/path/to/deck` makes the script resolve `playwright-chromium`
(or `playwright`) from that deck instead of the current directory.

It opens a presenter window (`/presenter`) and audience tabs in one headless
browser context and asserts, printing a `PASS` or `FAIL` line per check:

1. presenter pin: both audience tabs follow (server to viewer flow);
2. presenter click: both tabs follow;
3. tab click: presenter and the other tab follow (bus plus relay);
4. two rapid presenter clicks with one tab CPU-throttled: all windows end at 2
   clicks (the echo race);
5. a tab opened mid-talk at `/` adopts the live page and clicks, without
   disturbing the presenter, and stays put after the handshake;
6. two tabs with no presenter: a click in one applies in the other.

Exit code is 0 only if every check passes, 1 on failures, 2 on usage errors. If
every check fails with "no state", the script is looking at a page without
`window.__slidev__` (a build preview or the wrong URL); use the dev server.
Without the template's `setup/main.ts` the checks fail on purpose.

For a figure's own stages run
[`drive-figure.mjs`](workflow.html#drive-figuremjs) as well. The two checks are
complementary: slide-level sync versus figure staging.
