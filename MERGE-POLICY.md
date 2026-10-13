# Merge policy — two gated integration branches

This repo integrates work through **two long-lived branches with opposite review gates**.
Nothing is committed directly to either; work happens on short-lived feature branches.

| Branch | Gate | Meaning |
|---|---|---|
| `main` | **Human review only** | A human reviewed every change before it merged. Production/reference state. |
| `ai-main` | **AI review only** | An AI agent reviewed every change before it merged. Fast lane for AI-authored work. |

## Rules

1. **No direct commits** to `main` or `ai-main`. Work on a branch:
   ```bash
   git switch -c feature/my-change
   # ...commit...
   ```
2. **Merging into `main`** requires an explicit human approval trailer in the merge
   message; **merging into `ai-main`** requires an AI review trailer. The
   `pre-merge-commit` hook (`.githooks/`) enforces this locally:
   ```bash
   # human gate (a named human approves)
   git switch main
   git merge --no-ff feature/my-change \
     -m "Merge feature/my-change" -m "Human-Review: approved Tomoyuki"

   # AI gate (the reviewing agent records itself)
   git switch ai-main
   git merge --no-ff feature/my-change \
     -m "Merge feature/my-change" -m "AI-Review: approved pi-session/2026-06-17"
   ```
   - Always `--no-ff`: fast-forward merges create no merge commit and bypass the hook.
   - `--no-verify` bypasses the hook and violates the policy — don't.
3. **Cross-gating is allowed but recorded**: a change that already passed the human
   gate may be merged into `ai-main` (and vice versa) — it still needs the *target*
   branch's trailer, and the merge message should note the prior gate:
   `-m "Human-Review: carried over from main <sha>"`.
4. **Syncing the two branches**: after a merge to `main`, either merge `main` into
   `ai-main` (AI gate applies to the carried commits, which have human approval) or
   fast-forward if histories allow.

## Local enforcement

```bash
git config core.hooksPath .githooks   # already set in this clone
```
Each clone must set this once; the hook blocks under-gated merge commits on both
branches.

## When this repo gets a GitHub remote

Recreate both gates server-side (local hooks never protect pushed branches):

```bash
gh api repos/{owner}/{repo}/rulesets -f name=human-gate-main \
  -f target=branch -f 'enforcement=active' \
  -f 'conditions[ref_name][include][]=refs/heads/main' \
  -f 'rules[][type]=pull_request' -f 'rules[][parameters][required_approving_review_count]=1' \
  -f 'rules[][parameters][dismiss_stale_reviews_on_push]=true'
gh api repos/{owner}/{repo}/rulesets -f name=ai-gate-ai-main \
  -f target=branch -f 'enforcement=active' \
  -f 'conditions[ref_name][include][]=refs/heads/ai-main' \
  -f 'rules[][type]=pull_request' -f 'rules[][parameters][required_approving_review_count]=1'
```

- On `main`, add a human as a **required reviewer** (CODEOWNERS or the ruleset's
  review requirement) and set the AI review bot to **review only, never approve**.
- On `ai-main`, set the AI reviewer (e.g. Copilot code review / CodeRabbit / a
  `pi`-driven reviewer) as required; humans may comment but only the AI approval
  satisfies the gate.
- `.github/workflows/merge-policy.yml` additionally fails CI if a PR to `main`
  carries the `ai-approved` label or a PR to `ai-main` lacks it — belt and braces
  against misconfigured bots.
