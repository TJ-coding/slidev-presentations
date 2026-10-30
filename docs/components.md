---
title: Components
nav_order: 3
has_children: true
---

# Components

Every component lives in `template/components/` and is auto-imported deck-wide by
Slidev, so you write `<GovBox …/>` directly in `slides.md`. All of them animate at
the component level (fade/drop on click) and render their settled state in PDF
and PNG exports.

| Component | Use it for |
|---|---|
| [GovDerivation](gov-derivation.html) | Equation morphs with a ledger of the earlier steps, sections, callouts |
| [GovBox](gov-box.html) | Filled label block (a concept, a variable, a result) |
| [GovArrow](gov-arrow.html) | Data arrow: example value above, name below |
| [GovTriangle](gov-triangle.html) | The wide "therefore" ▼ |
| [GovChain](gov-chain.html) | Premises → ▼ → conclusion chains, any direction, any length |
| [GovPipe](gov-pipe.html) | N inputs → stage → M outputs |
| [GovStress](gov-stress.html) | The verdict box for bottom lines |
| [GovWindow](gov-window.html) | Pop-up window with a title bar, optional dimmed overlay |
| [TikzSync, D3Figure](figures.html) | Animated figures on the slide clock |
