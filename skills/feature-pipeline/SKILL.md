---
name: feature-pipeline
description: Use when the work is a feature — anything that adds, removes, or significantly changes user-visible behavior. Deep research, a spec that traces to the vision, build on the configured staging branch, QA in a real browser, then promote to production by cherry-pick (never a naive 3-way merge of a long-lived branch).
---
# Feature pipeline → staging first, promote by cherry-pick

A **feature** adds, removes, or significantly changes user-visible behavior (`feat(...)`).
Features land on the **staging branch** (`branches.staging` in `.superworkflow.json`) to be
validated in a real environment, then promote to the **production branch**
(`branches.production`, default `main`) as a separate PR. Promotion is **cherry-pick only** —
a naive 3-way merge of a long-lived branch silently drops work that landed on production after
staging last synced. If the config names a `rulesFile`, read it before asserting any branch
target; never state one from memory.

Work the 10 steps in order.

1. **Deep research (ai-pm + designer).** Find the top GitHub repos by stars solving this
   problem and read how they do it. If a YouTube/podcast URL covers the approach, transcribe
   it. Browse live competitors in a real/headless browser to see the shipped UX. Cite sources.
2. **Spec + vision link (ai-pm, co-signed by designer).** Problem, outcome, scope,
   testable acceptance criteria. **Every feature traces to a section of the project vision**
   (`context/VISION.md` or your vision file) — if it doesn't, route it back to the human
   before building. Flag anything in `humanGates` (pricing/billing, new top-level routes,
   brand/design system, new integrations, launch copy) for explicit approval.
3. **PLAN — ASK THE USER.** Enter plan mode, present the spec and approach. **Do not
   implement until the user approves** (exception: autonomous-loop mode; human-gate items
   are still parked).
4. **Branch + build.** Branch `<featurePrefix><slug>` off the production branch. Build the
   feature (full-stack / ai-engineer / mobile-dev). If your project has a mandatory
   per-feature checklist (onboarding tour, feature flag, analytics event, changelog entry),
   put it in your `rulesFile` and do it here. Functions < 50 lines, try/catch on async,
   typecheck + build clean.
5. **Lightweight staging gate → merge → deploy.** On the feature → staging PR, run the
   **diff-analysis gate only** (plus self-review). Do not run the full security battery at
   this stage. On green, squash-merge to the staging branch; it auto-deploys to the staging
   environment (`environments.staging`).
6. **QA on staging (qa-tester).** Exercise the feature against the staging deploy.
   **Playwright MCP is the default engine** — deterministic snapshot/click/console, and
   cross-browser (`--browser firefox` / `webkit`) on rendering-sensitive UI; a real
   logged-in browser is the fallback for auth/real-session flows. Capture evidence for each
   acceptance criterion. The human does final acceptance.
7. **Promote to production by CHERRY-PICK ONLY.** First rebase on the production branch. Then
   cherry-pick the feature commits onto a fresh branch off production. **Never** open a naive
   3-way merge PR from the long-lived staging branch — it silently deletes work added to
   production after the last sync and breaks structurally-coupled files.
   - **Cherry-pick conflict rule:** prefer the **staging branch's behavior** + **production's
     config/tokens** (env names, IDs, version pins). Watch for unrelated work being dragged
     in. If the cherry-pick surfaces a **pre-existing bug** on production, present it to the
     user as a decision (fix here / separate PR / leave) — do **not** silently fix it inside
     the promotion.
8. **Full prod gate on the promotion PR.** Run all three gates (code review + diff analysis +
   security review) on the accumulated diff. Paste all three reports inline. Block on any
   HIGH / auth / data-correctness finding. **A human merges to production — the agent does
   not.**
9. **Deploy + monitor (devops + log-admin).** Watch the prod deploy and error stream; confirm
   the feature is live.
10. **Close out.** Update `TEAM-BOARD.md`, link both PRs (staging + promotion), record
    findings; project-coordinator syncs the tracker; `/super-workflow:handoff` if heavy.
