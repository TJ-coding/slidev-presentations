#!/usr/bin/env python3
"""Build the live-demo deck for the docs site.

Every fenced ```html / ```md example in docs/*.md that is preceded by a
`<!-- demo: <id> -->` marker becomes one slide reachable at `#/<id>`
(Slidev `routeAlias`). The docs site's demo.js puts an iframe of that slide
under the example. A block that starts with `---` is used as a whole slide
(layout examples); anything else is wrapped in a `govuk` slide titled after
the page and section.

Usage: build_demo.py <docs-dir> <deck-dir>
  <deck-dir> is a scratch copy of skills/slidev-presentation/template;
  writes <deck-dir>/demo.md and the iframe bridge <deck-dir>/global-top.vue.
"""
import re
import shutil
import sys
from pathlib import Path

docs, deck = Path(sys.argv[1]), Path(sys.argv[2])
MARK = re.compile(r'<!-- demo: ([\w-]+) -->')
HEAD = re.compile(r'#{1,4} (.*)')

HEADMATTER = """---
theme: default
colorSchema: light
title: 'Quiet kit: live demos'
routerMode: hash
layout: govuk-cover
subtitle: 'Live examples from the documentation'
highlighter: shiki
transition: none
mdc: true
---
"""


def yaml_str(s: str) -> str:
    s = re.sub(r'`', '', s).replace("'", "''")
    return f"'{s}'"


def add_alias(block: str, alias: str) -> str:
    """insert routeAlias into the block's leading frontmatter"""
    lines = block.lstrip('\n').split('\n')
    assert lines[0].strip() == '---'
    return '\n'.join([lines[0], f'routeAlias: {alias}'] + lines[1:])


slides, seen = [], set()
for page in sorted(docs.glob('*.md')):
    text = page.read_text()
    title = re.search(r'^title: (.*)$', text, re.M)
    page_title = title.group(1).strip() if title else page.stem
    lines = text.split('\n')
    head, i = page_title, 0
    while i < len(lines):
        if m := HEAD.match(lines[i]):
            head = m.group(1)
        m = MARK.match(lines[i].strip())
        if m and i + 1 < len(lines) and lines[i + 1].startswith('```'):
            alias = m.group(1)
            j = i + 2
            while not lines[j].startswith('```'):
                j += 1
            block = '\n'.join(lines[i + 2:j]).strip('\n')
            if alias in seen:
                sys.exit(f'duplicate demo id {alias} in {page.name}')
            seen.add(alias)
            if block.lstrip().startswith('---'):
                slides.append(add_alias(block, alias))
            else:
                label = page_title if head == page_title else f'{page_title} · {head}'
                slides.append(
                    f'---\nlayout: govuk\ntitle: {yaml_str(label)}\nrouteAlias: {alias}\n---\n\n'
                    f'<div class="demo-stage">\n\n{block}\n\n</div>'
                )
            i = j
        i += 1

body = '\n\n'.join(s.rstrip() + '\n' for s in slides)
(deck / 'demo.md').write_text(HEADMATTER + '\n' + body)
shutil.copy(Path(__file__).with_name('global-top.vue'), deck / 'global-top.vue')
# the template's presenter/tab sync would tie all demos on a page together
(deck / 'setup' / 'main.ts').unlink(missing_ok=True)
# placeholder images the examples reference (/about.jpg, /results.png, ...)
shutil.copytree(Path(__file__).with_name('public'), deck / 'public', dirs_exist_ok=True)
print(f'demo.md: {len(slides)} demo slides')
