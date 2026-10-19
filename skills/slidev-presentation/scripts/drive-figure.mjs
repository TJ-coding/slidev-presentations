#!/usr/bin/env node
// drive-figure.mjs — verify a click-driven live figure (D3Figure slide) end-to-end:
// presses the arrow keys against the dev server and screenshots each state.
//
// Usage:
//   node drive-figure.mjs <slide-url> [press-spec] [outdir]
//
//   <slide-url>   e.g. http://localhost:3030/4   (the slide with the live figure)
//   [press-spec]  comma list of KEY:WAIT_MS pairs, default "R:4200,R:4200,L:4500,L:4200"
//                 (R = ArrowRight, L = ArrowLeft — forward, forward, reverse, reverse)
//   [outdir]      default /tmp/d3-drive
//
// Resolves playwright-chromium from the deck's node_modules (it is a template
// devDependency); pass DECK=/path/to/deck to point elsewhere.
// Exit code 0 and screenshots written even when pageerrors exist — ALWAYS read
// the log line "pageerrors:"; 'Wake Lock permission request denied' is benign
// headless noise, anything else is a real failure.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const [url, spec = "R:4200,R:4200,L:4500,L:4200", outdir = "/tmp/d3-drive"] = process.argv.slice(2);
if (!url) { console.error(__doc__); process.exit(2); }

let chromium;
try {
  ({ chromium } = createRequire(path.join(process.env.DECK ?? process.cwd(), "package.json"))("playwright-chromium"));
} catch {
  ({ chromium } = createRequire("/Users/tomoyuki-j/Projects/diagram-skills/skills/d3-diagrams/")("playwright-chromium"));
}

const waits = spec.split(",").map(s => s.trim().split(":"));
fs.mkdirSync(outdir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForSelector(".d3-figure .live svg, .motivation-figure .live svg", { timeout: 15000 });
await page.waitForTimeout(1600);                    // let the resting frame settle
let n = 0;
await page.screenshot({ path: path.join(outdir, `${String(++n).padStart(2, "0")}-rest.png`) });
for (const [key, ms] of waits) {
  await page.keyboard.press(key === "R" ? "ArrowRight" : key === "L" ? "ArrowLeft" : key);
  await page.waitForTimeout(Number(ms));
  await page.screenshot({ path: path.join(outdir, `${String(++n).padStart(2, "0")}-${key}.png`) });
}
console.log("done; pageerrors:", errors.length ? errors : "none");
await browser.close();
