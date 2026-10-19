# Deck plan: <Title>

> The plan is the contract; `slides.md` implements it. Write this BEFORE any slide,
> get it approved, and keep it true — update the row first, then the slide.
> Method: `references/planning.md` (in the skill).

## Brief

- **Audience**:
- **Occasion / venue**:
- **Duration** (→ slide budget, ~1–2 min per slide):
- **After this talk the audience should believe / do**:
- **Constraints** (light theme; figures via diagram sub-sessions; …):

## The story

One paragraph in claims: where it starts (the audience's current belief or problem),
the turn (what changes their mind), where it lands (the verdict / ask).

Question ladder — the question in the audience's head at each point, which the
section answers:

1.
2.

## Slides

| # | layout | title (assertion, ≤12 words) | message — the one claim they take away | intention | evidence / visual | notes |
|---|--------|------------------------------|----------------------------------------|-----------|-------------------|-------|
| 1 | govuk-cover | Canonical template deck | Every slide demonstrates one named pattern. | open | cover band | |
| 2 | govuk-section | How to use this template | Band, lead, budgets, patterns, ship. | signpost | band | |
| 3 | govuk | The visual-hierarchy doctrine | One focal point, straight into roles. | mechanism | roles flow | |
| 4 | govuk | Budgets, not vibes | Elements are rationed and lint-enforced. | mechanism | budget table + steps | |
| 5 | govuk | Pattern: glossary of emphasis | Panels and tags signal status. | introduce | green/red panels + tags | |
| 6 | govuk | Pattern: comparison | Claim left, evidence right. | introduce | two-role columns | |
| 7 | govuk | Code and syntax | Explanation left, code right. | introduce | code block | |
| 8 | govuk | Pattern: diagram | Draw the idea instead of listing it. | mechanism | matrix + bignum contrast | |
| 9 | govuk | Pattern: verdict & triangle | Stress boxes carry the verdict. | mechanism | gov-io + stress + ▼ | |
| 10 | govuk | Pattern: figure slide | A figure with caption is evidence. | introduce | image right + caption | |
| 11 | govuk | Pattern: data slide | One number leads; table supports. | introduce | takeaway + table | |
| 12 | govuk | Pattern: component kit | Patterns ship as runnable components. | introduce | GovChain + GovPipe demos | |
| 13 | govuk-end | Questions? | End band. | ask | end band | |

Intention vocabulary: open · signpost · introduce · mechanism · evidence ·
contrast · turn · caveat · verdict · ask.

## Figure requests (→ scripts/make-diagram.sh)

| slide | engine (d3/tikz) | slug | MESSAGE line for the brief |
|-------|------------------|------|----------------------------|
|  |  |  |  |
