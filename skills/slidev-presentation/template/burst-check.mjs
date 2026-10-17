// Burst-capture frames right after a click to verify the FLIP morph animates.
import { chromium } from 'playwright-chromium'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3040/13', { waitUntil: 'networkidle' })
await page.waitForSelector('.gd-equation .gd-tok', { timeout: 15000 })
await page.waitForTimeout(600)

await page.keyboard.press('ArrowRight')
for (let i = 0; i < 4; i++) {
  await page.waitForTimeout(120)
  await page.screenshot({ path: `/tmp/shots/burst-${i}.png`, timeout: 5000 })
  console.log(`burst-${i} captured`)
}
await browser.close()
