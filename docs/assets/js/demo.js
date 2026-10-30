// Live demos: every `<!-- demo: id -->` comment in a page marks the code block
// right after it. Below that block we mount an iframe of the demo deck's slide
// #/<id> (built from the same example by docs/_demo/build_demo.py) with
// step controls. The deck's bridge (docs/_demo/global-top.vue) reports
// { clicks, total } and obeys next / prev / reset.
(function () {
  const base = document.querySelector('meta[name="demo-base"]')?.content
    || (location.pathname.match(/^\/[^/]+\//)?.[0] || '/') + 'demo/'
  const frames = new Map()

  window.addEventListener('message', (e) => {
    const d = e.data
    if (!d || !d.slidevDemo) return
    const ui = frames.get(e.source)
    if (ui) ui.update(d.clicks, d.total)
  })

  function mount(id, after) {
    const box = document.createElement('div')
    box.className = 'live-demo'
    box.innerHTML = `
      <div class="live-demo-bar">
        <span class="live-demo-badge">Live</span>
        <button type="button" data-cmd="reset" title="Back to the first step">⟲</button>
        <button type="button" data-cmd="prev" title="Previous click">◀</button>
        <button type="button" data-cmd="next" class="primary" title="Next click">Next ▶</button>
        <span class="live-demo-hint">or click the slide and use ← →</span>
        <span class="live-demo-step"></span>
        <a class="live-demo-open" href="${base}#/${id}" target="_blank" rel="noopener" title="Open full screen">⤢</a>
      </div>
      <div class="live-demo-frame"></div>`
    after.insertAdjacentElement('afterend', box)
    const step = box.querySelector('.live-demo-step')
    const btn = (c) => box.querySelector(`[data-cmd="${c}"]`)
    let iframe = null

    const ui = {
      update(clicks, total) {
        step.textContent = total ? `click ${clicks} / ${total}` : 'static'
        btn('prev').disabled = btn('reset').disabled = clicks <= 0
        btn('next').disabled = clicks >= total
      },
    }
    box.addEventListener('click', (e) => {
      const c = e.target.closest('button')?.dataset.cmd
      if (c && iframe) iframe.contentWindow.postMessage({ slidevDemoCmd: c }, '*')
    })

    // load lazily: a Slidev app per example is heavy, so only near the viewport
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((en) => en.isIntersecting)) return
      io.disconnect()
      iframe = document.createElement('iframe')
      iframe.title = `Live demo: ${id}`
      iframe.src = `${base}?embedded=true#/${id}`
      box.querySelector('.live-demo-frame').appendChild(iframe)
      iframe.addEventListener('load', () => {
        frames.set(iframe.contentWindow, ui)
        iframe.contentWindow.postMessage({ slidevDemoCmd: 'hello' }, '*')
      })
    }, { rootMargin: '400px' })
    io.observe(box)
  }

  document.addEventListener('DOMContentLoaded', () => {
    const walker = document.createTreeWalker(document.querySelector('.main-content') || document.body, NodeFilter.SHOW_COMMENT)
    const marks = []
    while (walker.nextNode()) {
      const m = walker.currentNode.nodeValue.trim().match(/^demo:\s*([\w-]+)$/)
      if (m) marks.push([m[1], walker.currentNode])
    }
    for (const [id, node] of marks) {
      let el = node.nextSibling
      while (el && el.nodeType !== 1) el = el.nextSibling
      if (el) mount(id, el)
    }
  })
})()
