// Screenshot the GovDerivation demo slide at each click step.
import { chromium } from 'playwright-chromium'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto('http://localhost:3040/13', { waitUntil: 'networkidle' })
await page.waitForSelector('.gd-equation .gd-tok', { timeout: 15000 })
await page.waitForTimeout(600)

const out = process.argv[2] || '/tmp/shots'
await page.screenshot({ path: `${out}/step-0.png` })

// N steps → N-1 morphs; the press after the last morph navigates to the next slide.
const MORPHS = 6
for (let step = 1; step <= MORPHS; step++) {
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(260) // mid-morph
  await page.screenshot({ path: `${out}/step-${step}-mid.png` })
  await page.waitForTimeout(800) // settled
  await page.screenshot({ path: `${out}/step-${step}.png` })
}
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/after-last-morph.png` })

// dump the rendered token ids per step for verification
const ids = await page.$$eval('.gd-equation .gd-tok', (els) => els.map((e) => e.dataset.gdId))
console.log('final token ids:', JSON.stringify(ids))

await browser.close()
console.log('done')
