# Deck plan: Bi-encoder based utility function with linear scaling order

> Retrospective plan, reconstructed from the reproduction deck to demonstrate the
> plan-first mechanism (references/planning.md). The plan is the contract;
> `slides.md` implements it.

## Brief

- **Audience**: NLP lab members (regular meeting)
- **Occasion / venue**: lab regular meeting
- **Duration**: ~10 min → 9 slides
- **After this talk the audience should believe / do**: that a bi-encoder utility
  with linear scaling order makes MBR practical for text-based KGC, and back the
  linear-time claim with the scaling argument
- **Constraints**: GOV.UK light theme; figures via d3/tikz sub-sessions into
  `public/diagrams/`

## The story

MBR decoding is the safest way to pick a translation, but it is priced by the
utility model: score every candidate against every reference. Text-based KGC
inherits that price — pair encoding of hypotheses × references is O(n²) and
slow. The turn: a bi-encoder computes the utility from embeddings, so the
expensive model runs once per item and every pair becomes one dot product —
linear in n. Where it lands: linear-order utility makes MBR-style scoring
practical for KGC; ablations and timing are the open work before the next
submission.

Question ladder:

1. Why does MBR risk get expensive? → the score matrix.
2. How does the method remove the quadratic term? → two pipelines, then scaling.
3. What exactly is the architecture? → shared encoder + dot-product grid.
4. What is still unproven? → future works.

## Slides

| # | layout | title (assertion, ≤12 words) | message — the one claim they take away | intention | evidence / visual | notes |
|---|--------|------------------------------|----------------------------------------|-----------|-------------------|-------|
| 1 | govuk-cover | Bi-encoder based utility function with linear scaling order | open: today is about making MBR-style scoring affordable | open | cover band | mirrors p1 |
| 2 | govuk-section | Background | signpost: first, how MBR is priced | signpost | section divider | |
| 3 | govuk | MBR Decoding: For Translation | MBR picks the lowest-risk candidate among samples, priced by a score matrix | introduce | gov-flow + gov-matrix | mirrors p2; risk highlighted |
| 4 | govuk-section | Method | signpost: the method is a bi-encoder utility with linear order | signpost | bull-photo divider | mirrors p14 |
| 5 | govuk | Text-based KGC: two pipelines | pair encoding costs O(n²); entity encoding gives O(n) | contrast | gov-eq + gov-stress pair | mirrors p12 |
| 6 | govuk | The scaling gap | at 128 hypotheses the cross-encoder makes 64× more utility calls | evidence | d3 figure /diagrams/scaling/diagram.png | figure via sub-session |
| 7 | govuk | Architecture | one dot product per pair — no LLM call inside the score matrix | mechanism | d3 figure /diagrams/biencoder/diagram.png | mirrors p18; figure via sub-session |
| 8 | govuk | Conclusion and Future works | a linear-order utility for MBR; ablations and timing still open | ask | gov-flow (fix → ablate → ARR) | mirrors p24 |
| 9 | govuk-end | Questions? | invite questions on the complexity contrast | ask | end slide | |

## Figure requests (→ scripts/make-diagram.sh)

| slide | engine (d3/tikz) | slug | MESSAGE line for the brief |
|-------|------------------|------|----------------------------|
| 6 | d3 | scaling | utility calls grow quadratically with a cross-encoder but only linearly with a bi-encoder |
| 7 | d3 | biencoder | the bi-encoder computes two encodings per item and every pair is one dot product |
