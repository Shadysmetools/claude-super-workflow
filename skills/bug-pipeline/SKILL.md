---
name: bug-pipeline
description: Use when the work is a bug — anything broken, silently wrong, missing, or duplicated. Drives the fix from investigation through a production PR targeting the default branch (origin/main), with a full review gate before merge.
---
# Bug pipeline → production

A **bug** is anything that was broken, silently wrong, producing missing data, or producing duplicate data. Bugs are urgent and target production directly: the PR base is `origin/main`, not a staging branch. A human merges to `main` — the agent stops at PR-open.

Work the 10 steps in order. Do not skip ahead.

1. **Investigate.** Pull recent server/app logs for the failing path. Map the affected area with a knowledge-graph tool (god-nodes, communities, blast-radius) and index + RAG-search the relevant files so you understand the call graph before touching code. Cite what you find.
2. **Root-cause, not symptom.** Decide whether this is a local defect or an architectural problem. Write the one-sentence root cause. If it's architectural, say so in the plan — don't paper over it.
3. **(Optional) Pull related context.** If a recording, transcript, or ticket describes the repro, pull it in. Use it to confirm expected vs actual behavior.
4. **PLAN — ASK THE USER.** Enter plan mode. Present the root cause and the proposed fix. **Do not implement until the user approves the plan.**
5. **Branch + code.** Branch off `origin/main` (e.g. `<your-name>-<slug>`). Keep functions < 50 lines, wrap async in try/catch, validate input. Typecheck and build must be clean before you proceed.
6. **FULL review gate.** Run all three: your code-review bot, your diff-analysis tool, and your security-review tool against the branch diff. Paste every report inline in the PR body (not just links). **Block the merge** on any HIGH-severity finding, any auth / RLS / cross-tenant finding (regardless of severity), or any finding that touches user-facing data correctness (silently missing, miscounted, truncated, mislabelled, or wrong-record data). Show the user each blocking finding with file:line, propose a fix, push it to the same branch so the gate re-runs in place — never recreate the PR.
   - **Skip the gate only for:** docs-only diffs, pure config/CI YAML with no logic, or reverts of a commit on the same branch.
7. **QA with evidence.** Reproduce the original bug, apply the fix, and capture proof it's gone (logs, curl output, screenshot, or recording). Attach the evidence to the PR.
8. **Open the PR (base `main`) then STOP.** Target the default branch. Include a `## Test Plan` section and the three inlined gate reports. **A human merges to `main` — the agent does not.**
9. **Deploy + monitor.** After merge, watch the deploy and the error stream for the affected path. Confirm the fix is live and nothing regressed.
10. **Close out.** Update `TEAM-BOARD.md` with the outcome, link the PR, and record the root cause as a finding. If the session was heavy, write a handoff for the next session.
