// Sample ghost opacity/translate over time to see if the fade animates or snaps.
import { chromium } from 'playwright-chromium'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3040/13', { waitUntil: 'networkidle' })
await page.waitForSelector('.gd-equation .gd-tok', { timeout: 15000 })
await page.waitForTimeout(600)

await page.keyboard.press('ArrowRight')
const t0 = Date.now()
for (let i = 0; i < 12; i++) {
  const g = await page.$$eval('.gd-ghost-tok', els => els.map(e => ({
    op: getComputedStyle(e).opacity,
    tr: getComputedStyle(e).translate,
    fs: getComputedStyle(e).fontSize,
  })))
  console.log(`${Date.now() - t0}ms`, JSON.stringify(g))
  await page.waitForTimeout(90)
}
await browser.close()
