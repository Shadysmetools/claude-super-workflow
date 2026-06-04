---
name: feature-pipeline
description: Use when the work is a feature — anything that adds, removes, or significantly changes user-visible behavior. Builds on a staging branch first, then promotes to production by cherry-pick (never a naive 3-way merge of a long-lived branch).
---
# Feature pipeline → staging first, promote by cherry-pick

A **feature** adds, removes, or significantly changes user-visible behavior. Features land on a staging branch first to be validated in a real environment, then promote to `main` as a separate PR. Promotion is **cherry-pick only** — a naive 3-way merge of a long-lived branch silently drops work that landed on `main` after staging last synced.

Work the 10 steps in order.

1. **Deep research.** Find the top GitHub repos by stars solving this problem and read how they do it. If a YouTube URL covers the approach, transcribe it. Browse live competitors in a real/headless browser to see the shipped UX. Cite sources.
2. **Spec + acceptance criteria.** Write what "done" means as testable acceptance criteria before any code.
3. **PLAN — ASK THE USER.** Enter plan mode, present the spec and approach. **Do not implement until the user approves.**
4. **Branch + build.** Branch `<your-staging-branch>-<slug>` off `origin/main`. Build the feature. Functions < 50 lines, try/catch on async, typecheck + build clean.
5. **Lightweight staging gate → merge → deploy.** On the feature → staging PR, run your **diff-analysis tool only** (plus self-review). Do not run the full security battery at this stage. On green, squash-merge to the staging branch; it auto-deploys to the staging environment.
6. **QA in a real browser.** Exercise the feature against the staging deploy. Capture evidence (screenshots / recording) for each acceptance criterion.
7. **Promote to `main` by CHERRY-PICK ONLY.** First rebase the staging branch on `origin/main`. Then cherry-pick the feature commits onto a fresh branch off `origin/main`. **Never** open a naive 3-way merge PR from the long-lived staging branch — it silently deletes work added to main after the last sync.
   - **Cherry-pick conflict rule:** prefer the **staging branch's behavior** + **main's config/tokens** (env names, IDs, version pins). If the cherry-pick surfaces a **pre-existing bug** on main, present it to the user as a decision (fix here / separate PR / leave) — do **not** silently fix it inside the promotion.
8. **Full prod gate on the promotion PR.** Run all three: code-review bot + diff-analysis + security-review on the accumulated diff. Paste all three reports inline. Block on any HIGH / auth / data-correctness finding. A human merges to `main` — the agent does not.
9. **Deploy + monitor.** Watch the prod deploy and error stream; confirm the feature is live.
10. **Close out.** Update `TEAM-BOARD.md`, link both PRs (staging + promotion), record findings, hand off if heavy.
