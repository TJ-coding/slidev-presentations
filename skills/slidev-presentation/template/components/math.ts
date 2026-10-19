// math.ts — typeset `$…$` / `$$…$$` in component props via KaTeX.
//
// Markdown-level math never reaches component props: strings written straight
// into an attribute (e.g. `<GovChain top-box="$$\mathbf{A} \in \mathbb{C}^{n\times n}$$" />`)
// arrive as raw text, so labels typeset themselves. Anything outside the math
// delimiters passes through untouched — raw HTML (`<b>…</b>`, `<u>…</u>`)
// keeps working exactly as before.

import katex from 'katex'
// KaTeX's stylesheet ships separately from its JS — import it where the
// renderer lives so every deck using the components gets correct layout.
import 'katex/dist/katex.css'

function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: 'html',
    })
  } catch {
    return tex.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

/** Position of the closing `$$` (skipping `\x` escapes), else -1. */
function findDisplayClose(src: string, from: number): number {
  return findClose(src, from, '$$')
}

/** Position of the closing `$` of inline math — but an interim `$$` means the
 *  opener was never closed, so inline math never spans a `$$`. */
function findInlineClose(src: string, from: number): number {
  for (let i = from; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue }
    if (src.startsWith('$$', i)) return -1
    if (src[i] === '$') return i
  }
  return -1
}

function findClose(src: string, from: number, delim: string): number {
  for (let i = from; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue }
    if (src.startsWith(delim, i)) return i
  }
  return -1
}

export function typeset(src: string): string {
  if (!src) return ''
  let out = ''
  let i = 0
  while (i < src.length) {
    if (src[i] === '\\' && src[i + 1] === '$') { out += '$'; i += 2; continue }
    if (src.startsWith('$$', i)) {
      const end = findDisplayClose(src, i + 2)
      if (end !== -1 && end > i + 2) {
        out += renderMath(src.slice(i + 2, end), true)
        i = end + 2
        continue
      }
    }
    if (src[i] === '$') {
      const end = findInlineClose(src, i + 1)
      if (end !== -1 && end > i + 1) {
        out += renderMath(src.slice(i + 1, end), false)
        i = end + 1
        continue
      }
    }
    out += src[i]
    i++
  }
  return out
}
