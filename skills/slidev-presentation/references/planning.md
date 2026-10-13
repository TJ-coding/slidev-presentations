# Planning — the story before the slides

`slides.md` is an *implementation* of a plan. Write the plan first, get it
approved, only then write slides. The plan lives in **`<deck>/plan.md`** (scaffolded
with every new deck from `template/plan.md`).

Why: slides written one-by-one accrete into a topic list — related, but not a story.
A story has a spine: a question the audience is asking, a turn, and a landing they
remember. The plan is also where figure work is decided, so each diagram sub-session
(`references/diagrams.md`) receives a brief that already serves the story.

## The workflow

1. **Brief** — audience, occasion, duration (→ slide budget, ~1–2 min/slide), and the
   exit sentence: *after this talk the audience should believe / do what?*
   If you cannot write that sentence, interview the user before anything else.
2. **The story** — one paragraph, told in claims, not topics: where it starts
   (the audience's current belief or problem), the turn (what changes their mind),
   where it lands (the verdict/ask). Then a **question ladder**: for each section,
   the question in the audience's head at that moment; each section *answers* one.
3. **Slide contract** — one row per slide (see template): layout, title, **message**
   and **intention**, the evidence/visual that carries it.
4. **Show the plan, wait for approval.** "Slides follow" is not approval — present
   the story paragraph + slide table and let the user approve or edit. Then write
   `slides.md` strictly from the table, one slide at a time, in order.
5. **Keep the plan true.** Any slide change updates `plan.md` first (change the row,
   then the slide). Run `scripts/check-plan.py` — the plan/deck mismatch is a
   quality-gate failure, same as a lint failure.

For **existing decks without a plan**: reconstruct `plan.md` from the current deck
first (infer message + intention per slide), confirm with the user, *then* edit.

## The slide contract — message and intention

**Message** = the one claim the audience takes away, as a full sentence. Same
discipline as the slide's `lead:` line — in fact the message usually *becomes* the
lead verbatim. A topic is not a message ("MBR decoding" ❌; "MBR trades one strong
reference for many cheap samples" ✅). If a slide needs two messages, it is two slides.

**Intention** = what this slide is *doing* to the audience. Use one of the standard
roles (mix freely, but say which):

| Role | Doing what | Typical shape |
|---|---|---|
| `open` | frame the question / set stakes | cover, section divider |
| `signpost` | orient: where we are, what's next | section, roadmap |
| `introduce` | establish a concept or term | definition + one example |
| `mechanism` | show *how* it works | pipeline/flow, architecture figure |
| `evidence` | prove the previous claim | data plot, matrix, benchmark |
| `contrast` | separate X from Y to force a choice | two-cols, gov-contrast |
| `turn` | pivot: challenge the assumption so far | question slide, negative result |
| `caveat` | bound the claim, protect credibility | limitations, red band |
| `verdict` | land the takeaway | takeaway box, gov-stress |
| `ask` | request the decision/action | next steps, govuk-end |

Reading the intention column top-to-bottom should *be* the story. If two adjacent
slides have the same intention, one of them is probably redundant; if a slide has no
intention, it has no job — cut it or find one.

**Evidence/visual** = what carries the claim on screen: a `gov-*` primitive, mermaid,
or a figure. The moment a row's evidence is a real figure (data plot, precise
schematic), write the make-diagram brief *in the plan* — the figure section of
`plan.md` feeds `make-diagram.sh` verbatim (MESSAGE = the slide's message, not a new
invention).

## Formatting rules for plan.md

- Slide numbers are the row numbers — they are allowed to shift; renumber rather than
  leave gaps.
- Titles in the table should match `slides.md` titles (the checker compares them).
- Notes column is optional; intentions + messages are not.
- The plan is a markdown table so the checker can parse it — keep the header row from
  the template intact.
