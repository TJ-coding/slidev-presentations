# Bi-encoder score matrix

```sh
# render (from anywhere)
node "/Users/tomoyuki-j/Projects/diagram-skills/skills/d3-diagrams/scripts/render.mjs" . --formats svg,png,pdf,html --both-themes

# just the light SVG+PNG
node "/Users/tomoyuki-j/Projects/diagram-skills/skills/d3-diagrams/scripts/render.mjs" . --formats svg,png
```

Edit `diagram.js` (the `draw(svg, ctx)` function) and re-render. Output lands
in `./out/`. Keep the `meta` contract: `{ width, height, title }`.
