---
name: github-flow
description: This repo follows GitHub Flow — branch off main, commit, open a PR, merge, tag to deploy. Load when creating a branch, commit, issue, PR, or release in catopia, so naming and structure stay consistent with prior work (issues #3/#6/#7, PRs #4/#5/#8/#9/#10, releases v1.0.0-rc1..rc3).
---

# GitHub Flow for catopia

This repo uses standard [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): every change is a short-lived branch off `main`, opened as a PR, merged, then released via a tag. Nothing bespoke — the notes below are just how each generic step maps onto this repo's specifics.

## The flow

1. **Branch from `main`** — `git checkout main && git pull origin main && git checkout -b <type>/<kebab-slug>` (`feat/`, `fix/`, `chore/`, `docs/`).
2. **Commit** — imperative subject with type prefix; body explains _why_, not what the diff already shows. Trailer `Part of #N` if the tracking issue stays open after this lands, `Fixes #N` if this PR resolves it.
3. **Open a PR** — one PR per branch. Body: `## Summary` (what/why) + `## Test plan` (checkboxes only for what was actually verified — `bun run lint` / `bun run build` at minimum, plus a runtime check for anything with a runtime surface). Verify _before_ opening, not after.
4. **Merge** — once it's ready. No force-push, no amending already-pushed commits, no skipping hooks.
5. **Release** — tag `main` as `vX.Y.Z-rcN` (`git tag -a vX.Y.Z-rcN -m "..." && git push origin vX.Y.Z-rcN`), which triggers `deploy.yml`. Then `gh release create <tag> --prerelease --notes-file <file>`: `## Catopia vX.Y.Z-rcN` header, themed `###` sections, ending with a `**Full set of changes:**` compare link to the previous tag. Watch the triggered run through to completion before calling it done.

## Issues

File one for a real bug or multi-phase work worth tracking — not for every small change. Bug reports: `## Problem` → `## Root cause` (diagnose first, don't guess) → `## Fix` (see #6). Tracking/epics: phased checklists, noting which PR delivers which phase (see #3).

## Gotchas learned the hard way

- `.wrangler/state` is gitignored, local-only dev state. If `bun run build` fails with a workerd/SQLite error unrelated to your diff, `rm -rf .wrangler/state` before assuming the code is broken.
- `node_modules` doesn't revert on `git checkout` — `bun install` after switching branches that pin different dependency versions, before debugging a lint/build failure that looks unrelated to your change.
