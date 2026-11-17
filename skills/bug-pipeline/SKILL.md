---
name: bug-pipeline
description: Use when the work is a bug — anything broken, silently wrong, missing, or duplicated. Drives the fix from investigation (logs + knowledge graph + failure fingerprint) through a production PR targeting the configured production branch, with a full review gate and evidence-based QA before a human merges.
---
# Bug pipeline → production

A **bug** is anything that was broken, silently wrong, producing missing data, or producing
duplicate data. Bugs are urgent and target production directly: **branch off the production
branch** (`branches.production` in `.superworkflow.json`, default `main`) and open the PR
against it. **A human merges — the agent stops at PR-open.** If the config names a
`rulesFile`, read it before asserting any branch target; never state one from memory.

Work the 10 steps in order. Do not skip ahead.

1. **Investigate (log-admin + tech-lead).** Pull recent server/app logs for the failing path
   and reproduce. Map the affected area with a knowledge-graph tool (god-nodes, communities,
   blast-radius) and index + RAG-search the relevant files. Confirm the bug exists on the
   production branch / live environment, not just a stale branch.
   - **Fingerprint the failure set before theorizing.** If more than one record/user/run is
     affected, tally them first (one read-only query: platform, path, user, version, time).
     A uniform fingerprint is evidence — let it confirm or kill the reporter's hypothesis
     before you write a line.
   - **For third-party "lost content / no data" bugs, read the provider's live API (read-only)
     and the FULL status/event chain**, not just the terminal event — the real reason usually
     sits one event earlier. Keep credentials off the transcript: run the call where the
     secret lives and print only booleans/enums back.
2. **Root-cause vs architecture (platform-engineer + ai-engineer).** Decide whether this is a
   local defect or an architectural problem. Write the one-sentence root cause. If it's
   architectural, say so in the plan — don't paper over it. The owning role loads
   `systematic-debugging` (if installed); no fix plan is approved without a reproduction.
3. **(Optional) Pull related context.** If a recording, transcript, or ticket describes the
   repro, pull it in. Use it to confirm expected vs actual behavior. Never invent what a
   source said — if you can't read it, ask the user to paste it.
4. **PLAN — ASK THE USER.** Enter plan mode. Present root cause, change, blast radius, test
   plan. **Do not implement until the user approves** (exception: autonomous-loop mode, see
   `/super-workflow:loop` — the plan-gate is pre-negotiated, merges are still parked).
5. **Branch + code.** Branch off the production branch (`<bugPrefix><slug>`). Keep functions
   < 50 lines, wrap async in try/catch, validate input. Fix **every** call site of a shared
   helper, not just the one in the ticket. Typecheck and build must be clean before you
   proceed.
6. **FULL review gate.** Run all three configured gates (`gates.codeReview`,
   `gates.diffAnalysis`, `gates.securityReview`) against the branch diff. Paste every report
   inline in the PR body (not just links). **Block the merge** on any HIGH-severity finding,
   any auth / access-control / cross-tenant finding (regardless of severity), or any finding
   that touches user-facing data correctness (silently missing, miscounted, truncated,
   mislabelled, or wrong-record data). Show each blocking finding with file:line, propose a
   fix, push it to the same branch so the gate re-runs in place — never recreate the PR.
   - **Skip the gate only for:** docs-only diffs, pure config/CI YAML with no logic, or
     reverts of a commit on the same branch (still QA the revert).
7. **QA with evidence (qa-tester).** Reproduce the original bug, apply the fix, and capture
   proof it's gone. **Playwright MCP is the default engine** (accessibility-tree snapshots,
   deterministic clicks, console + network); a real logged-in browser is the fallback for
   auth/real-session flows. Evidence = snapshot + console/network excerpt, logs, or curl
   output. No sign-off without proof. Run `verification-before-completion` (if installed)
   before saying "fixed".
8. **Open the PR (base = production branch) then STOP.** Include a `## Test Plan` section and
   the three inlined gate reports. **A human merges — the agent does not.**
9. **Deploy + monitor (devops + log-admin).** After merge, watch the deploy job and the error
   stream for the affected path. Separate *your-diff* failures from known repo-wide noise and
   say which. Confirm the fix is live and nothing regressed.
10. **Close out.** Update `TEAM-BOARD.md` with the outcome, link the PR, and record the root
    cause as a finding; project-coordinator syncs the tracker. Run `/super-workflow:handoff`
    if context is heavy.

## Batching a multi-bug sweep
Group fixes **by area into a few PRs — never one PR per bug.** One-PR-per-bug sweeps flood
CI minutes and reviewers; a handful of well-scoped area PRs ship faster and gate cleaner.
