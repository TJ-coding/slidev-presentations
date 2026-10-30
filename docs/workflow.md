---
title: Workflow & scripts
nav_order: 1
---

# Workflow and scripts

Getting from nothing to an exported deck. In a consuming repository the kit sits
in a submodule (below), so the scripts live at
`kit/skills/slidev-presentation/scripts/`. Shorthand in this page:

```sh
KIT=kit/skills/slidev-presentation      # relative to your deck repository root
```

## 1. Add the kit as a submodule

Decks live in a separate repository (for example `slidev-decks`) that consumes
the kit, so the kit can improve without touching deck history.

```sh
cd ~/Projects/slidev-decks
git submodule add <URL-of-this-repo> kit     # pins a commit of the kit
git commit -m "chore: add slidev-presentations kit"
```

If the URL is a local file path, newer git blocks file transport by default:

```sh
git -c protocol.file.allow=always submodule add <path> kit
git submodule set-url kit <URL>     # swap in the real remote once it is hosted
```

When cloning a deck repository later, use `git clone --recurse-submodules` (or
`git submodule update --init` afterwards).

## 2. Scaffold a deck: `new-deck.sh`

```sh
$KIT/scripts/new-deck.sh "My Talk" my-talk
```

Usage: `new-deck.sh "Talk Title" [target-dir] [--no-install]`.

- `target-dir` defaults to `$(pwd)/<title lower-cased, spaces to hyphens>`. It
  must not exist (exit 1 otherwise).
- It `rsync`s `template/` to the target, excluding `node_modules`, `dist` and
  `.slidev-dev.log`.
- It rewrites the first `# Presentation Title` heading and the first
  `title:` line in `slides.md` using `sed -i ''` (macOS/BSD syntax; on GNU sed
  this needs adapting).
- It runs `npm install --silent` in the new deck unless the **third** argument is
  `--no-install` (so `target-dir` must be given to pass it).

The deck gets everything in the template: `slides.md` (a showcase deck where
every slide demonstrates one pattern), `plan.md`, `style.css`, `layouts/`,
`components/`, `setup/main.ts`, `scripts/build-tikz.mjs`, `tikz/src/`,
`snippets/`, `package.json`, `vite.config.ts`, and a few Playwright helper
scripts (`burst-check.mjs`, `ghost-check.mjs`, `shoot-derivation.mjs`,
`diag-katex.mjs`) that were written to debug `GovDerivation` against a dev
server on port 3040. They are not documented as part of the workflow; delete
them from your deck if unused.

## 3. Develop

```sh
cd my-talk
npm run dev        # slidev --open ; http://localhost:3030
```

Hot reload covers `slides.md`, components and `style.css`. Restart the server
after editing `setup/main.ts`.

### `serve.sh`

A detached alternative that survives the shell exiting:

```sh
$KIT/scripts/serve.sh <deck-dir>
```

It installs dependencies if `node_modules` is missing, kills a previous tmux
session named `slidev-<deck-dir basename>`, then runs `npx slidev --force`.

- With tmux: starts the session, writes the session name to `.slidev-dev.tmux`,
  tees output to `.slidev-dev.log`, and waits up to 30 s for
  `http://localhost:3030/` to answer. Stop with `tmux kill-session -t <session>`.
- Without tmux: uses `nohup`, writes `.slidev-dev.pid` and `.slidev-dev.log`,
  and sleeps 5 s. Stop with `kill $(cat <deck>/.slidev-dev.pid)`.

It does not check whether another deck already owns port 3030. Run `lsof -ti
:3030` first; a stale server serves the wrong deck.

## 4. Plan first: `plan.md`

The kit's rule is that slides implement a plan. Before any slide, fill
`<deck>/plan.md` (skeleton from `template/plan.md`) and get it approved.

1. **Brief:** audience, occasion, duration (about 1 to 2 minutes per slide, which
   gives the slide budget), and the exit sentence ("after this talk the audience
   should believe or do what?"). If you cannot write it, interview the user.
2. **The story:** one paragraph told in claims, not topics: where it starts, the
   turn, where it lands. Then a question ladder: the question in the audience's
   head at each section.
3. **Slide contract:** one row per slide in the `## Slides` table with columns
   `# | layout | title | message | intention | evidence / visual | notes`.
   - **Message** is the one claim the audience takes away, as a full sentence. It
     usually becomes the slide's `lead:` verbatim. A topic is not a message.
   - **Intention** is what the slide does to the audience, using the standard
     roles `open`, `signpost`, `introduce`, `mechanism`, `evidence`, `contrast`,
     `turn`, `caveat`, `verdict`, `ask`. Read top to bottom, the intentions
     should be the story.
   - **Evidence / visual** names what carries the claim. When it is a real figure,
     write the [`make-diagram.sh`](#make-diagramsh) brief in the plan.
4. Show the plan and wait for approval; then write `slides.md` strictly from the
   table, in order.
5. Keep the plan true: change the row first, then the slide.

Full method: `skills/slidev-presentation/references/planning.md`. For an
existing deck without a plan, reconstruct `plan.md` from the deck, confirm it,
then edit.

### `check-plan.py`

```sh
python3 $KIT/scripts/check-plan.py <deck-dir | path/to/slides.md>
```

Takes exactly one argument. Checks:

1. `plan.md` exists next to `slides.md` (exit 1 with a message if not);
2. the plan has rows in its `## Slides` table (a heading starting with `Slides`;
   rows are lines starting `| <number> |`; the title is the third column);
3. every slide that has a frontmatter `title:` has a plan row, and every plan
   row has a slide (lenient match: equal, or one title contains the other,
   case-insensitive, HTML tags stripped);
4. the slide count equals the plan row count.

Exit 0 on pass, 1 on failure, listing each mismatch. Only slides with a `title:`
line count as slides, so a slide without a title is invisible to the checker.

## 5. Lint: `lint-deck.py`

```sh
python3 $KIT/scripts/lint-deck.py [slides.md]      # default ./slides.md
```

It splits `slides.md` into slides and reports per-slide problems, printing
`slide N [layout]` followed by one line per problem. Exit 0 is clean, 1 means
warnings. Checks, in the order the script runs them:

1. **Layout set and known.** Missing `layout:` ("set a govuk-* layout
   explicitly") or a layout outside `govuk`, `govuk-cover`, `govuk-section`,
   `govuk-two-cols`, `govuk-image-right`, `govuk-end`, `govuk-about`, `dd`,
   `default`, `center`, `section`, `two-cols`.
2. **Title present.** Layouts `govuk`, `govuk-two-cols`, `govuk-image-right`,
   `govuk-end`, `dd` and `govuk-about` need frontmatter `title:`.
3. **Lead present.** Layout `govuk` needs a `lead:` takeaway.
4. **No markdown `# heading`** in the content layouts (`govuk`, `govuk-two-cols`,
   `govuk-image-right`, `govuk-end`); the band renders the title.
5. **Speaker notes** present (an HTML comment `<!-- ... -->`) on every layout
   except `govuk-section`.
6. **At most 5 bullets** (lines starting `- ` or `* `).
7. **At most 2 `govuk-emph` spans.**
8. **At most 2 `govuk-panel` boxes.**
9. **One focal anchor:** at most one of `govuk-lead` and `govuk-takeaway`
   occurrences in total.
10. **Show, don't tell**, for content layouts whose body has no visual (a visual
    is any of `gov-flow`, `gov-node`, `gov-matrix`, `gov-contrast`, `gov-bignum`,
    `gov-window`, `mermaid`, `image:`, `<img`, `GovDerivation`, `GovWindow`,
    `TikzSync`, `D3Figure`):
    - more than 35 prose words (code fences, style blocks and tags excluded) is
      "text-heavy";
    - 4 or more bullets is flagged as "bullets with no diagram".

The `dd` and `govuk-about` layouts are title-only (no `lead:` needed).

## 6. Export: `export.sh`

```sh
$KIT/scripts/export.sh <deck-dir> [pdf|pptx|png|spa] [extra args...]
```

The format defaults to `pdf`. It `cd`s into the deck, runs `npm install --silent`
if `node_modules` is absent, then:

| Format | Command | Output |
|---|---|---|
| `pdf`, `pptx`, `png` (anything except `spa`/`build`) | `npx slidev export --format <fmt> --output slides.<fmt> --per-slide [args]` | `<deck>/slides.<fmt>` |
| `spa` or `build` | `npm run build [args]` | `<deck>/dist` |

`--per-slide` makes global layers with navigation state (page numbers) render
correctly. The first Playwright Chromium run may need `npx playwright install
chromium`. Any extra arguments are appended to the Slidev command, for example
`--with-clicks`. The format is passed straight to Slidev, so it is not validated
by the script.

The template `package.json` has the equivalent npm scripts:

| Script | Runs |
|---|---|
| `npm run dev` | `slidev --open` |
| `npm run build` | `slidev build` |
| `npm run export` | `slidev export --per-slide` |
| `npm run export:pdf` | `slidev export --format pdf --per-slide` |
| `npm run export:pdf-notes` | `slidev export --format pdf --per-slide --with-clicks --with-toc` |
| `npm run export:pptx` | `slidev export --format pptx --per-slide` |
| `npm run export:png` | `slidev export --format png --per-slide` |
| `npm run build:tikz` | `node scripts/build-tikz.mjs` (see [Animated figures](figures.html#the-tikz-build-pipeline)) |

Note that `export.sh` names its output `slides.<fmt>` explicitly, while the npm
scripts use Slidev's default output name.

## 7. Figures

### `make-diagram.sh`

Builds one static figure in a headless `pi` sub-session with the diagram-skills
repo. See [Animated figures](figures.html#static-figures-and-sub-session-delegation)
for when to use it.

```sh
$KIT/scripts/make-diagram.sh <deck-dir> <d3|tikz> <slug> "MESSAGE sentence | data notes" \
  [--formats svg,png] [--dark]
```

- `<slug>` names the output directory `<deck-dir>/public/diagrams/<slug>/`
  (referenced in slides as `/diagrams/<slug>/diagram.png`).
- `--formats` defaults to `svg,png`; `--dark` requests both themes. Any other
  option exits 1.
- Environment `DIAGRAM_SKILLS` (default `~/Projects/diagram-skills`) must contain
  `skills/d3-diagrams` or `skills/tikz-diagrams`, otherwise exit 1.
- It requires the `pi` CLI on your PATH.
- The prompt asks the sub-session to scaffold with the skill's `new-diagram.sh`
  in the output directory, keep all artefacts there, and copy the final
  `diagram.svg` and `diagram.png` to its root.

### `drive-figure.mjs`

Headless check for a live D3 figure slide. Run from the deck directory.

```sh
node $KIT/scripts/drive-figure.mjs <slide-url> [press-spec] [outdir]
```

- `press-spec` is a comma list of `KEY:WAIT_MS` pairs. `R` is ArrowRight, `L` is
  ArrowLeft, and any other key name is passed to Playwright as is. Default
  `R:4200,R:4200,L:4500,L:4200`.
- `outdir` defaults to `/tmp/d3-drive`. It writes numbered screenshots
  (`01-rest.png`, `02-R.png`, ...) at 1280 by 720, 2x scale.
- It waits for `.d3-figure .live svg` (or `.motivation-figure .live svg`), so it
  only works on slides using `D3Figure`.
- `DECK=/path/to/deck` selects where `playwright-chromium` is resolved from.
- Exit code is 0 even when page errors occur: always read the `pageerrors:` line.
  Only `Wake Lock permission request denied` is benign.

### `check-sync.mjs`

Presenter, audience and tab sync check. See [Presenting & sync](presenting.html).

## 8. Quality gate before delivering

```sh
python3 $KIT/scripts/lint-deck.py  <deck>/slides.md
python3 $KIT/scripts/check-plan.py <deck>
$KIT/scripts/export.sh             <deck> pdf     # succeeds, no missing images
```

Before presenting live, also run `check-sync.mjs` (and `drive-figure.mjs` for
animated figures).

## 9. Updating the kit

Update the kit independently and bump the pin when you want the improvements:

```sh
cd kit && git pull && cd ..
git add kit && git commit -m "chore: bump kit"
```

Decks scaffolded earlier hold their own copy of `template/`: bumping the
submodule does not change them. Copy updated files (a component, `style.css`,
`setup/main.ts`) into the deck by hand when you want them.

## 10. Branch and merge policy

Two long-lived integration branches have opposite review gates (details in
`MERGE-POLICY.md`):

| Branch | Gate | Merge trailer |
|---|---|---|
| `main` | human review only | `Human-Review: approved <name>` |
| `ai-main` | AI review only | `AI-Review: approved <reviewer/session>` |

Rules:

1. No direct commits to `main` or `ai-main`; work on a feature branch.
2. Merge with `--no-ff` and the target branch's trailer in the message; a
   `pre-merge-commit` hook in `.githooks/` blocks under-gated merges.

   ```sh
   git switch main
   git merge --no-ff feature/my-change -m "Merge feature/my-change" -m "Human-Review: approved Tomoyuki"
   ```

   Fast-forward merges create no merge commit and bypass the hook, and
   `--no-verify` violates the policy.
3. Cross-gating is allowed but recorded: a change that passed one gate still needs
   the target's trailer, and the message should note the prior gate (for example
   `Human-Review: carried over from main <sha>`).
4. To sync the branches, merge `main` into `ai-main` (or fast-forward if
   histories allow).
5. Activate the hook once per clone: `git config core.hooksPath .githooks`.
6. When the repository gets a GitHub remote, recreate both gates server-side with
   rulesets, since local hooks never protect pushed branches.

Branches in your deck repository should follow the same policy.

## 11. Install the agent skill

`skills/slidev-presentation/SKILL.md` makes the kit usable by a `pi` agent: ask
for "a deck about X", or force it with `/skill:slidev-presentation`. Symlink the
skill directory into the agent's skills folder:

```sh
# from a direct clone of the kit
ln -sfn ~/Projects/slidev-presentations/skills/slidev-presentation \
        ~/.pi/agent/skills/slidev-presentation
# or from a repository that submodules the kit
ln -sfn ~/Projects/slidev-decks/kit/skills/slidev-presentation \
        ~/.pi/agent/skills/slidev-presentation
```

The skill's `name` is `slidev-presentation`. It tells the agent to plan first,
follow the slide budgets, use the component cookbook, and pass the quality gate
before delivering. It is not for editing `.pptx` files (use a PowerPoint skill
for that), although the kit can export `.pptx`.
