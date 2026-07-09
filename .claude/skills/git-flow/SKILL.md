---
name: git-flow
description: Consistent git/GitHub workflow for this repo — branching, commit style, issues, PRs, and releases. Load whenever creating a branch, commit, GitHub issue, pull request, or tagging a release in catopia, so the conventions match prior work (issues #3/#6/#7, PRs #4/#5/#8/#9, releases v1.0.0-rc1..rc3).
---

# Git flow for catopia

This codifies the workflow actually used across this repo's history so it stays consistent across sessions. Deviate only when the user explicitly asks for something different.

## Branching

- Always branch off an up-to-date `main`: `git checkout main && git pull origin main && git checkout -b <branch>`.
- Name branches `<type>/<kebab-slug>`, matching the commit prefix: `feat/…`, `fix/…`, `chore/…`, `docs/…` (e.g. `feat/case-studies-og-contact-db`, `fix/ncu-minor-upgrade-flag`, `chore/update-github-actions`).
- One branch per logical unit of work. A single tracking issue can span multiple branches/PRs (e.g. issue #3's Phase 1 → PR #4, Phase 2 → PR #5) — don't force unrelated work into one branch just because it shares a tracking issue.

## Commits

- Imperative subject line with a type prefix: `feat:`, `fix:`, `chore:`, `docs:`.
- Body explains **why**, not what the diff already shows — root cause for fixes, motivation for features. Skip the body only for truly trivial changes.
- Trailer: `Part of #N` when the commit contributes to an ongoing tracking issue that stays open after this work lands; `Fixes #N` / `Closes #N` only when this PR fully resolves that issue.
- Create NEW commits instead of amending, unless explicitly asked. Never force-push, never skip hooks (`--no-verify`), never rewrite already-pushed/merged history.
- Before staging broadly (`git add <dir>`), run `git status` and review — don't sweep in unrelated or generated files.

## Issues

Use an issue when there's a real bug to diagnose or multi-phase work to track — not for every small change.

- **Bug report** structure: `## Problem` (what's observed), `## Root cause` (once diagnosed — don't file speculative issues, dig in first), `## Fix` (the concrete change). See #6 for the template.
- **Tracking/epic** structure: objective, then phased checklists (`- [ ]`) grouped by phase, each annotated with current repo state where it changes the scope (e.g. "pages already exist — this is a content rewrite, not new pages"). Note which PR delivers which phase as those land. See #3 for the template.
- Prefer root-causing over guessing: reproduce or trace the actual failure (e.g. download the failing job's log via `gh api repos/<repo>/actions/jobs/<id>/logs`) before writing the issue.

## Pull requests

- One PR per branch/logical unit. Body structure:
  - `## Summary` — bullets of what changed and why, referencing the tracking issue (`Part of #N` / `Fixes #N`).
  - `## Test plan` — checklist of what was **actually verified** before opening the PR (checked boxes), with any follow-up-only items left unchecked. Never claim a check that wasn't run.
- Verify before opening, not after: `bun run lint` and `bun run build` at minimum; `bun dev` / `bun run preview` click-throughs for anything with a runtime surface (new pages, API routes, D1 writes). For Cloudflare-specific behavior (bindings, D1), prefer testing against `bun run preview` (the real Workers runtime) over `bun dev` alone.
- Use `gh pr create --body-file <scratchpad file>` rather than inlining long bodies in the shell command.

## Releases

- Version scheme so far: `v1.0.0-rcN`, incrementing N per deploy-worthy batch of merged work. Confirm with the user before switching schemes.
- Sequence:
  1. `git checkout main && git pull origin main` — confirm the intended PR(s) actually merged (`git log --oneline`).
  2. `git tag -a vX.Y.Z-rcN -m "vX.Y.Z-rcN" && git push origin vX.Y.Z-rcN` — this is what triggers `deploy.yml` (tag-push trigger), so don't tag until you actually want to deploy.
  3. `gh release create <tag> --prerelease --notes-file <scratchpad file>` — body structure: `## Catopia vX.Y.Z-rcN` header + one-line framing, then themed `###` sections (group by area: Content & SEO, Contact form & data, Fixes & Polish, etc.) with bullets, ending with `**Full set of changes:** https://github.com/<repo>/compare/<prev-tag>...<tag>`.
  4. Watch the triggered `deploy.yml` run (`gh run list --workflow deploy.yml` / `gh run view <id>`) through to `completed success` — don't consider the release done until it is. If the workflow has a new step since the last release (e.g. a migration step), check that specific step's log, not just overall success.

## Safety checkpoints

- Anything that provisions real cloud infrastructure (D1 databases, KV namespaces, secrets) or changes what's live in production: confirm the exact resource/values with the user before wiring them into `wrangler.jsonc`/committing — see how `catopia-crm`'s binding name was confirmed via `AskUserQuestion` before being committed.
- `git status` before any command that could discard uncommitted work.
- If a `bun run build` fails with a workerd/SQLite/Miniflare error unrelated to the actual diff, suspect local `.wrangler/state` drift (stale D1 state from a different wrangler version used on another branch) before assuming the code is broken — it's gitignored, local-only, safe to `rm -rf .wrangler/state` and rebuild.
- Switching branches does not revert `node_modules` — if `bun run lint`/`build` fails only on formatting or with version-looking errors right after a `git checkout` between branches with different dependency versions, `bun install` first to resync `node_modules` with the current branch's `package.json` before debugging further.
