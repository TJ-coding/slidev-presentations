import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tikzjax from 'node-tikzjax'

const tex2svg = tikzjax.default ?? tikzjax
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'tikz', 'src')
const outDir = join(root, 'tikz')

// TeX emits its own Computer Modern family names (cmbx9, cmmi6, cmr6, …).
// The rest of the deck sets math with KaTeX, whose faces are metric-compatible
// but not the same files; map the emitted names onto KaTeX so the inset and
// GovDerivation look like one system.
const KATEX_FONTS = [
  [/^cmbxti\d+$/, 'KaTeX_Main', { bold: true, italic: true }],
  [/^cmbx\d+$/, 'KaTeX_Main', { bold: true }],
  [/^cmti\d+$/, 'KaTeX_Main', { italic: true }],
  [/^cmr\d+$/, 'KaTeX_Main', {}],
  [/^cmmi\d+$/, 'KaTeX_Math', { italic: true }],
  [/^cmsy\d+$/, 'KaTeX_AMS', {}],
  [/^cmssbx\d+$/, 'KaTeX_SansSerif', { bold: true }],
  [/^cmss\d+$/, 'KaTeX_SansSerif', {}],
  [/^cmex\d+$/, 'KaTeX_Size1', {}],
  [/^cmtt\d+$/, 'KaTeX_Typewriter', {}],
]
function matchDeckMathFont(svg) {
  return svg.replace(/font-family="([^"]+)"/g, (full, family) => {
    for (const [name, katex, style] of KATEX_FONTS) {
      if (!name.test(family)) continue
      let attrs = `font-family="${katex}, serif"`
      if (style.bold) attrs += ' font-weight="bold"'
      if (style.italic) attrs += ' font-style="italic"'
      return attrs
    }
    return full
  })
}

// tikzjax writes raw TeX slot codes as characters (slots 0–9 shifted to
// U+00A1…, 10–32 to U+00AD…). Under a Unicode font those slots are the wrong
// glyphs — φ shows as ', − as ¡, \mathcal as plain capitals — so map the
// slots the deck uses back to Unicode before the family remap.
const tfmChar = (slot) => String.fromCharCode(slot <= 9 ? slot + 161 : slot <= 32 ? slot + 163 : slot)
const CM_GLYPHS = [
  // cmmi: lowercase Greek, slots 11–39
  [/^cmmi\d+$/, Object.fromEntries(
    [...'αβγδϵζηθικλμνξπρστυϕχψωεϑϖϱςφ'].map((g, i) => [tfmChar(11 + i), { text: g }]),
  )],
  // cmsy: operators; capitals are \mathcal
  [/^cmsy\d+$/, {
    [tfmChar(0)]: { text: '−', family: 'KaTeX_Main' },
    [tfmChar(1)]: { text: '⋅', family: 'KaTeX_Main' },
    [tfmChar(2)]: { text: '×', family: 'KaTeX_Main' },
    '!': { text: '→', family: 'KaTeX_Main' },
    '1': { text: '∞', family: 'KaTeX_Main' },
    '2': { text: '∈', family: 'KaTeX_Main' },
    ...Object.fromEntries([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((c) => [c, { text: c, family: 'KaTeX_Caligraphic' }])),
  }],
  // cmr / cmbx: ligatures and dashes
  [/^cm(r|bx)\d+$/, {
    [tfmChar(11)]: { text: 'ff' },
    [tfmChar(12)]: { text: 'fi' },
    [tfmChar(13)]: { text: 'fl' },
    '{': { text: '–' },
    '|': { text: '—' },
  }],
]
const ENTITIES = { '&apos;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>' }
const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function fixTexGlyphs(svg) {
  return svg.replace(/<text([^>]*)>([^<]*)<\/text>/g, (full, attrs, body) => {
    const family = attrs.match(/font-family="([^"]+)"/)?.[1]
    const table = CM_GLYPHS.find(([name]) => name.test(family ?? ''))?.[1]
    if (!table) return full
    const chars = [...body.replace(/&\w+;/g, (e) => ENTITIES[e] ?? e)]
    const glyph = table[chars[0]]
    // a run is one font, so a remapped family applies only to single glyphs
    if (glyph?.family && chars.length === 1) {
      return `<text${attrs.replace(/font-family="[^"]+"/, `font-family="${glyph.family}, serif"`)}>${escapeXml(glyph.text)}</text>`
    }
    const text = chars.map((c) => (table[c] && !table[c].family ? table[c].text : c)).join('')
    return `<text${attrs}>${escapeXml(text)}</text>`
  })
}

await mkdir(outDir, { recursive: true })
const files = (await readdir(srcDir)).filter((f) => f.endsWith('.tex')).sort()
for (const file of files) {
  const source = await readFile(join(srcDir, file), 'utf8')
  let svg
  try {
    svg = await tex2svg(source, {
      showConsole: process.env.TIKZ_DEBUG === '1',
      tikzLibraries: 'animations,positioning,arrows.meta,decorations.pathreplacing',
    })
  } catch (error) {
    console.error(`tikz build failed: ${file}`)
    console.error('re-run with TIKZ_DEBUG=1 for the TeX log')
    throw error
  }
  const out = join(outDir, `${basename(file, '.tex')}.svg`)
  await writeFile(out, matchDeckMathFont(fixTexGlyphs(svg)))
  console.log(`built ${out}`)
}
