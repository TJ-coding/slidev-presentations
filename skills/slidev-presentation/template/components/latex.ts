// latex.ts — LaTeX tokenizing + KaTeX rendering for GovDerivation.
//
// A derivation step is split into renderable tokens: single atoms, commands
// with their arguments, brace groups, and bases with attached super/subscripts.
// Every token renders standalone via KaTeX, and tokens are matched across
// steps by their source text — so surviving tokens can fly to their new
// position (FLIP) while new tokens fade in and removed ones drift away.
// That is Manim's TransformMatchingTex effect, in the browser.
//
// Matrix-like environments (\begin{bmatrix}…) are split one level deep: into
// two bracket pieces plus one token per non-empty cell, each carrying a
// row/column position. The bracket pieces render as a real `\left[…` sized by
// a \vphantom of the whole environment; cells render standalone with that
// environment's row strut (\@arstrut: 0.7em high, 0.3em deep) baked in, so a
// CSS grid (see GovDerivation's template) reproduces KaTeX's array banding.
// Tokens inside a matrix therefore match across steps exactly like tokens on
// the main line. Deeper environments (an env nested inside a cell) stay one
// opaque token. Environments that aren't rows×cells (aligned, array…) also
// stay one token.
//
// \boxed{…} and \fbox{…} split the same way — an invisible opener/closer pair
// marks the body, whose tokens render as free tokens inside a CSS-drawn box
// (.gd-box, mirroring KaTeX's 0.04em fbox rule + 0.3em boxpad). The box can't
// be a real KaTeX \fbox because that would fuse the inner tokens into one
// rendered unit — CSS keeps them matchable, so the result step's tokens morph
// with the previous line instead of swapping wholesale.

import katex from 'katex'
// KaTeX's stylesheet ships separately from its JS — import it where the
// renderer lives so every deck using the component gets correct layout.
import 'katex/dist/katex.css'

export type TokClass = 'bin' | 'rel' | 'punct' | 'open' | 'close' | 'op' | 'ord'

/** Placement of a token inside a matrix-like environment (0-indexed). */
export interface TokPlace {
  row: number
  col: number
  rows: number
  cols: number
}

export interface Tok {
  /** Unique within a step: source text, with a `#n` suffix for repeats. */
  id: string
  /** LaTeX source of this token — renders standalone. */
  tex: string
  /** Role class; drives the CSS margins that stand in for KaTeX's mspace. */
  cls: TokClass
  /** Set when this token came out of a matrix-like environment: its
   *  row/column position there (see splitEnvBody). */
  cell?: TokPlace
  /** Set on the two bracket pieces of a split environment: which environment
   *  it opens/closes (and its body source, for \vphantom bracket sizing). */
  env?: TokEnvInfo
  /** Set on the two pieces of a \boxed/\fbox wrapper: the body source. The
   *  pieces render nothing — the box is drawn by CSS around the body tokens. */
  box?: TokBoxInfo
  /** Set on a top-level `\\` inside a \boxed/\fbox body: KaTeX can't break
   *  a line there (\\ does nothing in display mode), so the template draws
   *  a real `.gd-br` break inside the box instead of a glyph. */
  brk?: true
}

/** A split \boxed/\fbox wrapper: source body. */
export interface TokBoxInfo {
  cmd: string
  body: string
}

/** A split matrix-like environment: source body + delimiter pair. */
export interface TokEnvInfo {
  env: string
  /** Body source (between \begin{env} and \end{env}), used for the
   *  `\vphantom{body}` that sizes the bracket pieces to the real array. */
  body: string
  /** Delimiters for the skeleton render: `left`/`right` may be '' when the
   *  environment has no bracket on that side (plain matrix, cases). */
  left: string
  right: string
}

export interface RenderedTok extends Tok {
  html: string
}

/** Render tree: leaf tokens, or an environment body hosting its cell tokens
 *  in a CSS grid (node built only once the \end piece has been seen). A boxed
 *  node draws its wrapper with CSS — KaTeX can't lose its \fbox mid-morph.
 *  A top-level `\\` in the source yields a `{ kind: 'br' }` node — the
 *  template renders it as a `.gd-br` block (display:block, height 0) that
 *  starts a new centered line in the inline flow. */
export type RNode =
  | { kind: 'tok'; tok: RenderedTok }
  | { kind: 'br'; id: string }
  | {
      kind: 'env'
      open: RenderedTok
      close: RenderedTok
      cells: RenderedTok[]
      /** set for \boxed/\fbox: cells render inline inside a .gd-box border,
       *  not in a grid with cell placement */
      boxed?: TokBoxInfo
    }

/** Row/column preprocessing for environments. Delimiters are LaTeX for
 *  \left/\right — '' means no bracket on that side. Environments not listed
 *  (aligned, array, …) stay one whole-environment token. */
const ENV_DELIM: Record<string, { left: string; right: string }> = {
  matrix: { left: '', right: '' },
  bmatrix: { left: '[', right: ']' },
  pmatrix: { left: '(', right: ')' },
  Bmatrix: { left: '\\{', right: '\\}' },
  vmatrix: { left: '|', right: '|' },
  Vmatrix: { left: '\\|', right: '\\|' },
  cases: { left: '\\{', right: '' },
  dcases: { left: '\\{', right: '' },
}

/* ------------------------------------------------------------------ */
/* classification — KaTeX inserts <span class="mspace"> between atoms  */
/* of a full expression; per-token rendering needs the margins back.  */
/* ------------------------------------------------------------------ */

const BIN_CMDS = new Set([
  '\\times', '\\cdot', '\\div', '\\pm', '\\mp', '\\cap', '\\cup',
  '\\oplus', '\\ominus', '\\otimes', '\\oslash', '\\wedge', '\\vee',
  '\\setminus', '\\star', '\\ast', '\\triangleleft', '\\triangleright',
])

const REL_CMDS = new Set([
  '\\leq', '\\geq', '\\leqq', '\\geqq', '\\neq', '\\ne', '\\approx',
  '\\equiv', '\\sim', '\\simeq', '\\cong', '\\propto', '\\to',
  '\\rightarrow', '\\leftarrow', '\\Rightarrow', '\\Leftarrow',
  '\\longrightarrow', '\\longleftarrow', '\\Longrightarrow', '\\Longleftarrow',
  '\\leftrightarrow', '\\Leftrightarrow', '\\mapsto', '\\rightleftharpoons',
  '\\implies', '\\impliedby',
  '\\ll', '\\gg', '\\subset',
  '\\supset', '\\subseteq', '\\supseteq', '\\in', '\\ni', '\\notin',
  '\\perp', '\\parallel', '\\mid', '\\vdash', '\\dashv',
])

const OP_CMDS = new Set([
  '\\sum', '\\prod', '\\coprod', '\\int', '\\oint', '\\iint', '\\iiint',
  '\\lim', '\\liminf', '\\limsup', '\\log', '\\ln', '\\lg', '\\sin',
  '\\cos', '\\tan', '\\cot', '\\sec', '\\csc', '\\arcsin', '\\arccos',
  '\\arctan', '\\sinh', '\\cosh', '\\tanh', '\\exp', '\\min', '\\max',
  '\\sup', '\\inf', '\\det', '\\gcd', '\\deg', '\\arg', '\\bmod', '\\mod', '\\Pr',
])

const OPEN_CMDS = new Set([
  '\\{', '\\langle', '\\lfloor', '\\lceil', '\\lvert', '\\lVert',
])

const CLOSE_CMDS = new Set([
  '\\}', '\\rangle', '\\rfloor', '\\rceil', '\\rvert', '\\rVert',
])

// commands that take one argument ({group}, \cmd, or single char) which must
// stay inside the token — \mathbf alone is a KaTeX parse error.
// NOTE: bare names, not \-prefixed — the tokenizer matches against `name`
const ONE_ARG_CMDS = new Set([
  'mathbf', 'mathrm', 'mathcal', 'mathbb', 'mathsf', 'mathtt', 'mathit',
  'bm', 'boldsymbol', 'pmb', 'bold',
  'hat', 'widehat', 'bar', 'overline', 'underline',
  'vec', 'overrightarrow', 'overleftarrow',
  'dot', 'ddot', 'tilde', 'widetilde',
  'check', 'acute', 'breve', 'grave',
  'overbrace', 'underbrace',
  'text', 'textrm', 'textbf', 'textit', 'textsf', 'texttt',
  'operatorname', 'substack',
  'mathbin', 'mathrel', 'mathord', 'mathop', 'mathopen', 'mathclose',
])

function classifyCmd(tex: string): TokClass {
  if (BIN_CMDS.has(tex)) return 'bin'
  if (REL_CMDS.has(tex)) return 'rel'
  if (OP_CMDS.has(tex)) return 'op'
  if (OPEN_CMDS.has(tex)) return 'open'
  if (CLOSE_CMDS.has(tex)) return 'close'
  if (tex === '\\ldots' || tex === '\\cdots' || tex === '\\dots' || tex === '\\ddots' || tex === '\\vdots')
    return 'punct'
  return 'ord'
}

function classifyChar(c: string, prev: Tok | undefined): TokClass {
  if (c === '+' || c === '-') {
    // unary when nothing precedes it, or the previous token cannot take a
    // binary operator after it (another operator, a relation, an opener…)
    const unary = !prev
      || prev.cls === 'bin'
      || prev.cls === 'rel'
      || prev.cls === 'open'
      || prev.cls === 'punct'
    return unary ? 'ord' : 'bin'
  }
  if (c === '*' || c === '/') return 'bin'
  if (c === '=' || c === '<' || c === '>') return 'rel'
  if (c === ',' || c === ';' || c === ':') return 'punct'
  if (c === '(' || c === '[') return 'open'
  if (c === ')' || c === ']') return 'close'
  return 'ord'
}

/* ------------------------------------------------------------------ */
/* tokenizer                                                           */
/* ------------------------------------------------------------------ */

/** Split an environment body into rows (`\\`) and cells (`&`). Only
 *  top-level separators cut: groups ({…}) and nested environments
 *  (\begin{env}…\end{env}) stay intact inside their cell. A single-char
 *  command at the cursor (e.g. \&) is never mistaken for a separator. */
function splitEnvBody(src: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let start = 0
  let depth = 0
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]!
    if (c === '\\') {
      if (src[i + 1] === '\\') {
        row.push(src.slice(start, i))
        rows.push(row)
        row = []
        start = i + 2
        i += 2
        continue
      }
      let j = i + 1
      while (j < n && /[a-zA-Z]/.test(src[j]!)) j++
      if (src.slice(i + 1, j) === 'begin') {
        // jump over the nested \begin{env} body as one opaque block
        const p = src.indexOf('}', j)
        const env = src.slice(j + 1, p === -1 ? n : p)
        const BEG = `\\begin{${env}}`
        const END = `\\end{${env}}`
        let d = 1
        let k = p + 1
        while (k < n && d > 0) {
          const b = src.indexOf(BEG, k)
          const e = src.indexOf(END, k)
          if (e === -1) { k = n; break }
          if (b !== -1 && b < e) { d++; k = b + BEG.length }
          else { d--; k = e + END.length }
        }
        i = k
        continue
      }
      i = j + (j === i + 1 ? 1 : 0) // skip \cmdname (or the one char of \,)
      continue
    }
    if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '&' && depth === 0) {
      row.push(src.slice(start, i))
      start = i + 1
    }
    i++
  }
  row.push(src.slice(start))
  rows.push(row)
  return rows
}

/* ------------------------------------------------------------------ */
/* top-level line breaks                                               */
/* ------------------------------------------------------------------ */

/** Split a tex at top-level `\\` row separators, so an equation can wrap
 *  onto several lines (GovDerivation stages them as centered lines; the
 *  history ledger renders them stacked too). `\\` nested in a brace group
 *  (an underbrace label, a \text{…}) or in a matrix/aligned environment
 *  does not cut; the optional spacing argument `\\[1em]` is consumed
 *  together with the break. */
export function splitLineBreaks(src: string): string[] {
  const lines: string[] = []
  let start = 0
  let depth = 0
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]!
    if (c === '\\') {
      if (src[i + 1] === '\\') {
        if (!depth) {
          lines.push(src.slice(start, i))
          i += 2
          if (src[i] === '[') {
            const close = src.indexOf(']', i)
            i = close === -1 ? n : close + 1
          }
          start = i
        } else {
          i += 2 // `\\` inside a group — keep it with its line
        }
        continue
      }
      let j = i + 1
      while (j < n && /[a-zA-Z]/.test(src[j]!)) j++
      if (src.slice(i + 1, j) === 'begin') {
        // jump over the nested \begin{env} body as one opaque block
        const p = src.indexOf('}', j)
        const env = src.slice(j + 1, p === -1 ? n : p)
        const BEG = `\\begin{${env}}`
        const END = `\\end{${env}}`
        let d = 1
        let k = p + 1
        while (k < n && d > 0) {
          const b = src.indexOf(BEG, k)
          const e = src.indexOf(END, k)
          if (e === -1) { k = n; break }
          if (b !== -1 && b < e) { d++; k = b + BEG.length }
          else { d--; k = e + END.length }
        }
        i = k
        continue
      }
      i = j + (j === i + 1 ? 1 : 0) // skip \cmdname (or the one char of \,)
      continue
    }
    if (c === '{') depth++
    else if (c === '}') depth--
    i++
  }
  lines.push(src.slice(start))
  // drop blank lines; keep the rest verbatim — trim() would eat the trailing
  // space of a line-ending `\ ` (backslash-space), leaving a bare `\` that
  // KaTeX can't parse, and stray whitespace is harmless to KaTeX anyway
  return lines.filter(l => /[\S]/.test(l))
}

export function tokenize(src: string): Tok[] {
  const toks: Tok[] = []
  const n = src.length
  let i = 0

  /** Read a `{…}` group starting at `src[i] === '{'`; returns the inner text.
   *  On return the cursor sits past the closing `}`. */
  const readBraceGroup = (): string => {
    let depth = 0
    const start = i
    for (; i < n; i++) {
      const c = src[i]!
      if (c === '\\') { i++; continue }
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          const inner = src.slice(start + 1, i)
          i++ // consume the closing brace
          return inner
        }
      }
    }
    return src.slice(start + 1)
  }

  /** Read the argument of a `^`/`_`: a brace group, a command, or one char.
   *  A one-argument command keeps its argument, so `_\text{state}` stays
   *  whole (an underbrace label would otherwise split into `_\text` + `{state}`). */
  const readScriptArg = (): string => {
    if (src[i] === '{')
      return `{${readBraceGroup()}}`
    if (src[i] === '\\') {
      let j = i + 1
      while (j < n && /[a-zA-Z]/.test(src[j]!)) j++
      const cmd = src.slice(i, j)
      const name = cmd.slice(1)
      i = j
      if (ONE_ARG_CMDS.has(name) || name === 'boxed' || name === 'fbox') {
        const arg = readScriptArg()
        return `${cmd}${arg.startsWith('{') ? arg : `{${arg}}`}`
      }
      return cmd
    }
    return src[i++]!
  }

  /** Push a token, attaching any trailing `^{…}`/`_{…}` scripts to it.
   *  `extra` seeds optional fields (cell placement, env info). */
  const pushTok = (tex: string, cls: TokClass, extra: Partial<Tok> = {}) => {
    while (i < n && (src[i] === '^' || src[i] === '_')) {
      const kind = src[i]!
      i++
      const arg = readScriptArg()
      tex += `${kind}${arg.startsWith('{') ? arg : `{${arg}}`}`
    }
    toks.push({ tex, cls, id: '', ...extra })
  }

  while (i < n) {
    const c = src[i]!

    if (/\s/.test(c)) { i++; continue }

    if (c === '\\') {
      i++
      let name = ''
      while (i < n && /[a-zA-Z]/.test(src[i]!)) { name += src[i]; i++ }
      if (name === '') { name = src[i]!; i++ } // single-char command: \, \; \: \! \\ …

      let tex = `\\${name}`
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'binom'
        || name === 'genfrac' || name === 'overset' || name === 'underset') {
        tex += `{${readBraceGroup()}}{${readBraceGroup()}}`
      } else if (name === 'sqrt') {
        if (src[i] === '[') {
          let j = i + 1
          let d = 0
          while (j < n) {
            if (src[j] === '[') d++
            else if (src[j] === ']') { d--; if (d === 0) break }
            j++
          }
          tex += src.slice(i, Math.min(j + 1, n))
          i = Math.min(j + 1, n)
        }
        tex += `{${readBraceGroup()}}`
      } else if (name === 'sum' || name === 'prod' || name === 'coprod' || name === 'int'
        || name === 'iint' || name === 'iiint' || name === 'oint' || name === 'lim'
        || name === 'liminf' || name === 'limsup' || name === 'min' || name === 'max'
        || name === 'sup' || name === 'inf' || name === 'det' || name === 'gcd') {
        // limits may come in either order: \sum_{i=0}^{n}
        while (src[i] === '_' || src[i] === '^') {
          const kind = src[i]!
          i++
          const arg = readScriptArg()
          tex += `${kind}${arg.startsWith('{') ? arg : `{${arg}}`}`
        }
      } else if (name === 'left' || name === 'right') {
        if (src[i] === '\\') {
          let j = i + 1
          while (j < n && /[a-zA-Z]/.test(src[j]!)) j++
          tex += src.slice(i, j)
          i = j
        } else {
          tex += src[i]!
          i++
        }
      } else if (name === 'begin') {
        // environments: rows×cells kinds (matrix family, cases) split one
        // level into two bracket pieces plus one token per non-empty cell —
        // so a symbol inside a matrix matches across steps like a line token
        // (and \left…\right scripts, e.g. a trailing ^T, land on the closing
        // piece). Everything else stays one token: \begin{env}…\end{env},
        // & and \\ inside included.
        const env = readBraceGroup()
        const BEG = `\\begin{${env}}`
        const END = `\\end{${env}}`
        let depth = 1
        let j = i
        while (j < n && depth > 0) {
          const b = src.indexOf(BEG, j)
          const e = src.indexOf(END, j)
          if (e === -1) { j = n; break }
          if (b !== -1 && b < e) { depth++; j = b + BEG.length }
          else { depth--; j = e + END.length }
        }
        const body = src.slice(i, j - END.length)
        i = j
        const delims = ENV_DELIM[env]
        const envInfo = { env, body, left: delims?.left ?? '', right: delims?.right ?? '' }
        if (!delims) {
          pushTok(`${BEG}${body}${END}`, 'ord')
          continue
        }
        toks.push({ tex: BEG, cls: 'open', id: '', env: envInfo })
        const rows = splitEnvBody(body)
        const nrows = rows.length
        const ncols = Math.max(1, ...rows.map(r => r.length))
        rows.forEach((rowCells, r) => {
          rowCells.forEach((raw, c) => {
            const cellTex = raw.trim()
            if (!cellTex) return
            const place = { row: r, col: c, rows: nrows, cols: ncols }
            const sub = tokenize(cellTex)
            if (sub.length === 1 && !sub[0]!.env) {
              sub[0]!.cell = place
              toks.push(sub[0]!)
            } else {
              // multi-atom cell or nested environment: one opaque token
              toks.push({ tex: cellTex, cls: 'ord', id: '', cell: place })
            }
          })
        })
        pushTok(END, 'close', { env: envInfo })
        continue
      } else if (name === 'boxed' || name === 'fbox') {
        // \boxed{…}/\fbox{…}: invisible opener/closer pair mark the body, whose
        // tokens are emitted as ordinary line tokens — so the box's inner
        // tokens morph with the previous step instead of the whole result
        // swapping as one fused token (a real \fbox{body} would fuse them).
        if (src[i] !== '{') { pushTok(tex, classifyCmd(tex)); continue } // malformed — opaque
        const body = readBraceGroup()
        const boxInfo = { cmd: name, body }
        toks.push({ tex, cls: 'open', id: '', box: boxInfo })
        for (const t of tokenize(body)) {
          // a top-level `\\` in the body can't render a break (KaTeX: \\\\
          // does nothing in display mode) — mark it for the template to draw
          // a real .gd-br line break inside the box
          toks.push(t.tex === '\\\\' ? { id: '', tex: '', cls: 'ord', brk: true } : t)
        }
        toks.push({ tex: '}', cls: 'close', id: '', box: boxInfo })
        continue
      } else if (ONE_ARG_CMDS.has(name)) {
        const arg = readScriptArg()
        tex += arg.startsWith('{') ? arg : `{${arg}}`
      }
      pushTok(tex, classifyCmd(tex))
      continue
    }

    if (c === '{') {
      pushTok(`{${readBraceGroup()}}`, 'ord')
      continue
    }

    if (c === '^' || c === '_') {
      // leading script — attach to the previous token when there is one
      const kind = c
      i++
      const arg = readScriptArg()
      const script = `${kind}${arg.startsWith('{') ? arg : `{${arg}}`}`
      const prev = toks[toks.length - 1]
      if (prev) prev.tex += script
      else pushTok(script, 'ord')
      continue
    }

    pushTok(c, classifyChar(c, toks[toks.length - 1]))
    i++
  }

  return toks
}

/* ------------------------------------------------------------------ */
/* rendering                                                           */
/* ------------------------------------------------------------------ */

/** \underbrace sits at the depth of its content, so on one line a brace
 *  over a plain symbol rides higher than one over a subscripted token —
 *  same for the label under it. Baking a fixed depth rule into every
 *  underbraced content pins all braces (and labels) to one line;
 *  \overbrace gets the mirrored height rule. */
const BRACE_DEPTH = '\\rule[-0.32em]{0pt}{0pt}'
const BRACE_HEIGHT = '\\rule[0.32em]{0pt}{0pt}'

/** index of the `}` matching the `{` at `open`, or -1 */
function closeBrace(tex: string, open: number): number {
  let depth = 0
  for (let i = open; i < tex.length; i++) {
    const c = tex[i]
    if (c === '\\') { i++; continue }
    if (c === '{') depth++
    else if (c === '}' && --depth === 0) return i
  }
  return -1
}

/** insert a depth/height strut inside every brace command's argument —
 *  display-only: token tex (and thus morph identity) keeps the original. */
function braceStruts(tex: string): string {
  let out = ''
  let i = 0
  while (i < tex.length) {
    const m = tex[i] === '\\' ? /^\\(under|over)brace\{/.exec(tex.slice(i)) : null
    if (m) {
      const open = i + m[0].length - 1
      const close = closeBrace(tex, open)
      if (close > 0) {
        out += m[0] + braceStruts(tex.slice(open + 1, close))
          + (m[1] === 'under' ? BRACE_DEPTH : BRACE_HEIGHT) + '}'
        i = close + 1
        continue
      }
    }
    out += tex[i]
    i++
  }
  return out
}

export function renderTex(tex: string): string {
  try {
    const lines = splitLineBreaks(tex)
    return lines
      .map(line => katex.renderToString(braceStruts(line), {
        displayMode: true,
        throwOnError: false,
        strict: false,
        output: 'html',
      }))
      .join('<br>')
  } catch {
    return escapeHtml(tex)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** inline markup a note carries through: line breaks (`<br>`, or a literal
 *  newline) and emphasis (`<strong>`/`<em>`, plus their `<b>`/`<i>` aliases)
 *  — every other tag stays escaped, so notes remain plain text + math */
const NOTE_TAG_RE = /<\/?(?:strong|b|em|i)\s*\/?>|<br\s*\/?>/gi

/** escape a note's text chunks, letting sanctioned markup through: a `<br>`
 *  tag (or a literal newline) becomes a real `<br>` element and `<strong>`/
 *  `<em>` emphasis survives as markup — every other tag stays escaped, so
 *  notes remain plain text + math */
function escapeNoteText(s: string): string {
  const tags: string[] = []
  return s
    .replace(NOTE_TAG_RE, (tag) => {
      const kept = tag.toLowerCase().replace(/\s+/g, '').replace('/>', '>')
      return `\u0000${tags.push(kept) - 1}\u0000`
    })
    .replace(/\n/g, () => `\u0000${tags.push('<br>') - 1}\u0000`)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u0000(\d+)\u0000/g, (_, n) => tags[Number(n)])
}

/** Render a note with inline math: `$…$` spans become KaTeX (inline mode),
 *  the surrounding text is HTML-escaped but may carry the sanctioned inline
 *  markup (`<br>`, `<strong>`, `<em>`). `\$` is a literal dollar sign, an
 *  unbalanced `$` stays literal, and `<br>` (or a newline) breaks the line.
 *  Feeds GovDerivation's notes. */
export function renderNote(note: string): string {
  if (!note.includes('$')) return escapeNoteText(note)
  let out = ''
  let text = ''
  let i = 0
  const n = note.length
  while (i < n) {
    const c = note[i]!
    if (c === '\\' && note[i + 1] === '$') { text += '$'; i += 2; continue }
    if (c !== '$') { text += c; i++; continue }
    // opening $ — scan ahead for the closing one, `\$` digraphs stay literal
    let j = i + 1
    let src = ''
    while (j < n) {
      if (note[j] === '\\' && note[j + 1] === '$') { src += '$'; j += 2; continue }
      if (note[j] === '$') break
      src += note[j]
      j++
    }
    if (j >= n) { text += '$'; i++; continue } // unbalanced — literal dollar
    out += escapeNoteText(text)
    text = ''
    try {
      out += katex.renderToString(braceStruts(src), {
        displayMode: false,
        throwOnError: false,
        strict: false,
        output: 'html',
      })
    } catch {
      out += escapeHtml(`$${src}$`)
    }
    i = j + 1
  }
  return out + escapeNoteText(text)
}

/* ------------------------------------------------------------------ */
/* matrix environments                                                  */
/* ------------------------------------------------------------------ */

/** KaTeX html of a matrix-cell token: the cell's tex with the array row
 *  strut baked in invisibly. KaTeX's array gives every row an \@arstrut
 *  (0.7em high, 0.3em deep at the default \arraystretch of 1), which is
 *  what spaces and pitches array rows — baking the same strut into every
 *  cell lets GovDerivation's CSS grid reproduce that banding exactly.
 *  The tex lives in a brace group so the strut rule adds no inter-atom
 *  space (a bare rule before \mid, say, would shift the cell contents). */
const CELL_STRUT = '\\rule[-0.36em]{0pt}{1.2em}'

function renderCellTex(tex: string): string {
  return renderTex(`${CELL_STRUT}{${tex}}`)
}

/** KaTeX html of an environment bracket piece: the delimiter alone, sized
 *  by a zero-width \vphantom of the whole environment (height+depth match
 *  the real array). Bracket-less sides render empty — the piece still
 *  exists as a token so both brackets pair up consistently across steps. */
function renderEnvPiece(tok: Tok): string {
  const { left, right, body } = tok.env ?? { left: '', right: '', body: '' }
  const delim = tok.cls === 'open' ? left : right
  if (!delim) return ''
  const phantom = `\\vphantom{\\begin{${tok.env!.env}}${body}\\end{${tok.env!.env}}}`
  return renderTex(tok.cls === 'open'
    ? `\\left${delim}${phantom}\\right.`
    : `\\left.${phantom}\\right${delim}`)
}

/** Tokenize + render a whole step, assigning matchable ids. Returns a render
 *  tree: leaf tokens, plus one node per matrix-like environment holding its
 *  bracket pieces and cell tokens in reading order.
 *  `canon` optionally maps a token's tex to a canonical identity — tokens
 *  sharing one morph into each other across steps instead of fading apart. */
export function renderStep(tex: string, canon?: (tex: string) => string): RNode[] {
  const seen = new Map<string, number>()
  const nodes: RNode[] = []
  let brSeq = 0
  const nodesOf = (line: string): RNode[] => {
    const out: RNode[] = []
    let env: { open: RenderedTok; cells: RenderedTok[]; boxed?: TokBoxInfo } | null = null
    for (const t of tokenize(line)) {
      const base = canon ? canon(t.tex) : t.tex
      const k = seen.get(base) ?? 0
      seen.set(base, k + 1)
      const html = t.env ? renderEnvPiece(t) : t.cell ? renderCellTex(t.tex) : t.box ? '' : renderTex(t.tex)
      const rt: RenderedTok = { ...t, id: k === 0 ? base : `${base}#${k}`, html }
      if ((t.env || t.box) && t.cls === 'open') {
        env = { open: rt, cells: [], boxed: t.box }
        continue
      }
      if ((t.env || t.box) && t.cls === 'close') {
        if (env && env.boxed === t.box) {
          out.push({ kind: 'env', open: env.open, close: rt, cells: env.cells, boxed: env.boxed })
          env = null
          continue
        }
        // unbalanced input: keep the piece as a plain bracket token
        out.push({ kind: 'tok', tok: rt })
        continue
      }
      if (env) {
        env.cells.push(rt)
        continue
      }
      out.push({ kind: 'tok', tok: rt })
    }
    // unterminated \begin or \boxed (defensive): keep its pieces inline
    if (env) {
      out.push({ kind: 'tok', tok: env.open })
      for (const c of env.cells) out.push({ kind: 'tok', tok: c })
    }
    return out
  }
  // top-level `\\` wraps the equation onto centered lines — a break node
  // between the line node runs lets the template start a new line while the
  // tokens across lines keep morphing (they're matched by id, not by line)
  const lines = splitLineBreaks(tex)
  lines.forEach((line, li) => {
    if (li > 0) {
      const k = brSeq++
      nodes.push({ kind: 'br', id: k === 0 ? '\\br' : `\\br#${k}` })
    }
    nodes.push(...nodesOf(line))
  })
  return nodes
}

/** Flatten a render tree back to its rendered pieces, in reading order —
 *  the piece list ids are matched against, and the ghost ramp builds from. */
export function collectToks(nodes: RNode[]): RenderedTok[] {
  const flat: RenderedTok[] = []
  for (const nd of nodes) {
    if (nd.kind === 'env') {
      flat.push(nd.open)
      flat.push(...nd.cells)
      if (nd.close) flat.push(nd.close)
    } else if (nd.kind !== 'br') {
      flat.push(nd.tok)
    }
  }
  return flat
}
