#!/usr/bin/env node
// check-sync.mjs — verify presenter / audience / multi-tab navigation sync
// against a running dev server.
//
// Usage:
//   node check-sync.mjs <slide-url> [--timeout 6000] [--throttle 8]
//
//   <slide-url>  a slide on the dev server, e.g. http://localhost:3030/4
//                (the script pins every window to this slide first)
//   --timeout    per-assertion wait in ms (default 6000)
//   --throttle   CPU throttling rate for the slow-audience echo test (default 8)
//
// Requires the deck template's hardened setup/main.ts. Without it the checks
// fail on purpose: stock Slidev never syncs viewer↔viewer and its viewer echo
// can lose/rewind clicks under load.
//
// Resolves playwright-chromium from the deck's node_modules (it is a template
// devDependency); pass DECK=/path/to/deck to point elsewhere.
//
// Exit code 0 only when every check passes. Prints one PASS/FAIL line per
// assertion so a failing run localises the layer (server flow, local bus,
// echo race, late join, viewer-only).
import { createRequire } from "node:module";
import path from "node:path";

const args = process.argv.slice(2);
if (!args.length) { console.error("usage: check-sync.mjs <slide-url> [--timeout ms] [--throttle n]"); process.exit(2); }
const url = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const TIMEOUT = opt("--timeout", 6000);
const THROTTLE = opt("--throttle", 8);

const parsed = new URL(url);
const origin = parsed.origin;
const slideNo = Number(parsed.pathname.split("/").filter(Boolean).pop());
if (!Number.isInteger(slideNo) || slideNo < 1) {
  console.error(`cannot read a slide number from ${url} — pass e.g. ${origin}/4`);
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = createRequire(path.resolve(process.env.DECK ?? process.cwd(), "package.json"))("playwright-chromium"));
} catch {
  try {
    ({ chromium } = createRequire(path.resolve(process.env.DECK ?? process.cwd(), "package.json"))("playwright"));
  } catch {
    console.error("playwright not found — run from the deck dir (or set DECK=), or `npm i -D playwright-chromium`");
    process.exit(2);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
function pass(label, detail = "") { console.log(`PASS ${label}${detail ? ` — ${detail}` : ""}`); }
function fail(label, detail = "") { failures++; console.log(`FAIL ${label}${detail ? ` — ${detail}` : ""}`); }

async function state(page) {
  return page.evaluate(() => {
    const nav = window.__slidev__?.nav;
    if (!nav) return null;
    // __slidev__ is a Vue reactive context, so refs arrive unwrapped (a
    // raw useNav() would need .value — accept both shapes)
    const unref = v => (v && typeof v === "object" && "value" in v ? v.value : v);
    return { page: unref(nav.currentSlideNo), clicks: unref(nav.clicks) };
  });
}
async function ready(page) {
  await page.waitForFunction(() => window.__slidev__?.nav, null, { timeout: 20000 });
}
async function pin(page, n) {
  await page.evaluate(([n]) => window.__slidev__.nav.go(n, 0), [n]);
}
async function waitForState(page, n, clicks, timeout = TIMEOUT) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const s = await state(page);
    if (s && s.page === n && s.clicks === clicks) return true;
    await sleep(100);
  }
  return false;
}
async function assertState(page, n, clicks, label) {
  const ok = await waitForState(page, n, clicks);
  const s = await state(page);
  ok && s ? pass(label) : fail(label, `expected slide ${n} clicks ${clicks}, got ${s ? `${s.page} clicks ${s.clicks}` : "no state"}`);
  return ok;
}
async function assertStable(page, n, clicks, label, settle = 600) {
  await sleep(settle);
  const s = await state(page);
  (s && s.page === n && s.clicks === clicks)
    ? pass(label)
    : fail(label, `state moved to ${s ? `${s.page} clicks ${s.clicks}` : "no state"} after settling`);
}
async function press(page, key) {
  await page.bringToFront();
  await page.keyboard.press(key);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const pages = [];
const open = async (u) => { const p = await context.newPage(); pages.push(p); await p.goto(u); await ready(p); return p; };

try {
  // ---- scenario 1: presenter -> viewers, then presenter presses -------------
  const presenter = await open(`${origin}/presenter`);
  await pin(presenter, slideNo);
  const tabA = await open(`${origin}/${slideNo}`);
  const tabB = await open(`${origin}/${slideNo}`);

  await Promise.all([
    assertState(presenter, slideNo, 0, "presenter is pinned"),
    assertState(tabA, slideNo, 0, "tab A follows the presenter pin"),
    assertState(tabB, slideNo, 0, "tab B follows the presenter pin"),
  ]);

  await press(presenter, "ArrowRight");
  await Promise.all([
    assertState(presenter, slideNo, 1, "presenter click applies"),
    assertState(tabA, slideNo, 1, "tab A follows a presenter click"),
    assertState(tabB, slideNo, 1, "tab B follows a presenter click"),
  ]);

  // ---- scenario 2: viewer-initiated nav relays to everyone -----------------
  await press(tabA, "ArrowRight");
  await Promise.all([
    assertState(tabA, slideNo, 2, "tab A click applies locally"),
    assertState(tabB, slideNo, 2, "tab B follows a viewer click (local bus)"),
    assertState(presenter, slideNo, 2, "presenter follows a viewer click (relay)"),
  ]);

  // ---- scenario 3: rapid presses + slow audience (the echo race) -----------
  await pin(presenter, slideNo);              // back to the first click stage
  await waitForState(tabA, slideNo, 0);
  await waitForState(tabB, slideNo, 0);
  const cdp = await context.newCDPSession(tabB);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
  await press(presenter, "ArrowRight");
  await sleep(120);
  await press(presenter, "ArrowRight");
  await Promise.all([
    assertState(presenter, slideNo, 2, "rapid press 2/2 applies in presenter"),
    assertState(tabA, slideNo, 2, "rapid press 2/2 applies in fast tab"),
    assertState(tabB, slideNo, 2, "rapid press 2/2 applies in slow tab (no echo rewind)"),
  ]);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

  // ---- scenario 4: a tab opened mid-talk adopts the live position -----------
  const late = await open(`${origin}/`);
  await Promise.all([
    assertState(late, slideNo, 2, "late-joining tab adopts the live position"),
    assertState(presenter, slideNo, 2, "late join does not disturb the presenter"),
  ]);
  await assertStable(late, slideNo, 2, "late join stays put after handshake");

  // ---- scenario 5: two tabs, no presenter window ---------------------------
  for (const p of [late, tabA, tabB, presenter]) await p.close();
  const t1 = await open(`${origin}/${slideNo}`);
  const t2 = await open(`${origin}/${slideNo}`);
  await pin(t1, slideNo);                      // broadcast settles both at 0
  await Promise.all([
    assertState(t1, slideNo, 0, "viewer-only: tab 1 pinned"),
    assertState(t2, slideNo, 0, "viewer-only: tab 2 follows the pin"),
  ]);
  await press(t1, "ArrowRight");
  await Promise.all([
    assertState(t1, slideNo, 1, "viewer-only: click applies locally"),
    assertState(t2, slideNo, 1, "viewer-only: other tab follows (no presenter needed)"),
  ]);
} catch (e) {
  fail("harness", e.message);
} finally {
  await browser.close();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall sync checks passed");
process.exit(failures ? 1 : 0);
