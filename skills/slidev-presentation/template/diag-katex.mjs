import { chromium } from 'playwright-chromium'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3040/13', { waitUntil: 'networkidle' })
await page.waitForSelector('.gd-equation .gd-tok', { timeout: 15000 })
await page.waitForTimeout(500)

const diag = await page.evaluate(() => {
  // is katex CSS loaded?
  let katexRules = 0
  let vlistRule = null
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.cssText.includes('vlist-t')) vlistRule = rule.cssText
        if (rule.cssText.includes('KaTeX')) katexRules++
      }
    } catch { /* cross-origin */ }
  }
  const tok = document.querySelector('[data-gd-id="x^{2}"]')
  const vlist = tok?.querySelector('.vlist-t')
  const script = tok?.querySelector('.vlist > span > span:last-child')
  const cs = vlist ? getComputedStyle(vlist) : null
  const csScript = script ? getComputedStyle(script) : null
  const tokCs = tok ? getComputedStyle(tok) : null
  return {
    katexRules,
    vlistRule,
    vlistDisplay: cs?.display,
    vlistRect: vlist?.getBoundingClientRect().toJSON(),
    scriptTop: csScript?.top,
    scriptFontSize: csScript?.fontSize,
    scriptRect: script?.getBoundingClientRect().toJSON(),
    tokRect: tok?.getBoundingClientRect().toJSON(),
    tokDisplay: tokCs?.display,
    tokFont: tokCs?.font?.slice(0, 80),
    html: tok?.innerHTML.slice(0, 400),
  }
})
console.log(JSON.stringify(diag, null, 2))
await browser.close()
