// latex.ts — LaTeX tokenizing + KaTeX rendering for GovDerivation.
//
// A derivation step is split into renderable tokens: single atoms, commands
// with their arguments, brace groups, and bases with attached super/subscripts.
// Every token renders standalone via KaTeX, and tokens are matched across
// steps by their source text — so surviving tokens can fly to their new
// position (FLIP) while new tokens fade in and removed ones drift away.
// That is Manim's TransformMatchingTex effect, in the browser.

import katex from 'katex'
// KaTeX's stylesheet ships separately from its JS — import it where the
// renderer lives so every deck using the component gets correct layout.
import 'katex/dist/katex.css'

export type TokClass = 'bin' | 'rel' | 'punct' | 'open' | 'close' | 'op' | 'ord'

export interface Tok {
  /** Unique within a step: source text, with a `#n` suffix for repeats. */
  id: string
  /** LaTeX source of this token — renders standalone. */
  tex: string
  /** Role class; drives the CSS margins that stand in for KaTeX's mspace. */
  cls: TokClass
}

export interface RenderedTok extends Tok {
  html: string
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
  'boxed', 'fbox',
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
   *  A command keeps its own argument(s), so `_\text{state}` stays whole. */
  const readScriptArg = (): string => {
    if (src[i] === '{')
      return `{${readBraceGroup()}}`
    if (src[i] === '\\')
      return readCommand()
    return src[i++]!
  }

  /** Read a `\cmd` with its arguments — one unit, cursor on the backslash.
   *  Argument-bearing commands keep their braces so the token renders
   *  standalone (`\mathbf` alone is a KaTeX parse error). */
  const readCommand = (): string => {
    i++ // past the backslash
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
      // whole environment is one token: \begin{env}…\end{env} — matrices
      // and aligned blocks must render as a unit, & and \\ included
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
      tex += `{${env}}${src.slice(i, j)}`
      i = j
    } else if (ONE_ARG_CMDS.has(name)) {
      const arg = readScriptArg()
      tex += arg.startsWith('{') ? arg : `{${arg}}`
    }
    return tex
  }

  /** Push a token, attaching any trailing `^{…}`/`_{…}` scripts to it. */
  const pushTok = (tex: string, cls: TokClass) => {
    while (i < n && (src[i] === '^' || src[i] === '_')) {
      const kind = src[i]!
      i++
      const arg = readScriptArg()
      tex += `${kind}${arg.startsWith('{') ? arg : `{${arg}}`}`
    }
    toks.push({ tex, cls, id: '' })
  }

  while (i < n) {
    const c = src[i]!

    if (/\s/.test(c)) { i++; continue }

    if (c === '\\') {
      const tex = readCommand()
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
    return katex.renderToString(braceStruts(tex), {
      displayMode: true,
      throwOnError: false,
      strict: false,
      output: 'html',
    })
  } catch {
    return escapeHtml(tex)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Render a note with inline math: `$…$` spans become KaTeX (inline mode),
 *  the surrounding text is HTML-escaped. `\$` is a literal dollar sign, and
 *  an unbalanced `$` stays literal. Feeds GovDerivation's notes. */
export function renderNote(note: string): string {
  if (!note.includes('$')) return escapeHtml(note)
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
    out += escapeHtml(text)
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
  return out + escapeHtml(text)
}

/** Tokenize + render a whole step, assigning matchable ids.
 *  `canon` optionally maps a token's tex to a canonical identity — tokens
 *  sharing one morph into each other across steps instead of fading apart. */
export function renderStep(tex: string, canon?: (tex: string) => string): RenderedTok[] {
  const seen = new Map<string, number>()
  return tokenize(tex).map((t) => {
    const base = canon ? canon(t.tex) : t.tex
    const k = seen.get(base) ?? 0
    seen.set(base, k + 1)
    return { ...t, id: k === 0 ? base : `${base}#${k}`, html: renderTex(t.tex) }
  })
}
