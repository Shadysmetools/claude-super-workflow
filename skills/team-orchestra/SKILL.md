---
name: team-orchestra
description: Run one task through the full role lifecycle. The tech-lead takes a single task analyze → research → plan → code → review → commit → build → deploy → monitor → test, spawning specialists in parallel where steps are independent. Trigger with "/team-orchestra", "use the team", or "orchestrate this".
---
# Team Orchestra — run one task through the full role lifecycle

A single entry point the tech-lead uses to drive **one** task all the way through. The main agent stays the decision-maker; specialist roles are spawned to do the work, **in parallel wherever the steps are independent**.

Trigger phrases: `/team-orchestra`, "use the team", "orchestrate this".

## Lifecycle

1. **Analyze** — restate the task, identify the affected area, read `TEAM-BOARD.md` and warm-recall (graph + RAG + memory).
2. **Research** — pull prior art and existing patterns in the repo; cite them.
3. **Plan** — write the approach and acceptance criteria. For non-trivial work, ask the user to approve the plan before coding.
4. **Code** — implement. Functions < 50 lines, try/catch on async, input validated, typecheck + build clean.
5. **Review** — run the review gate (lightweight for staging, full battery for a production promotion). Block on HIGH / auth / data-correctness findings.
6. **Commit** — small, well-described commits on a correctly-named branch.
7. **Build** — confirm the build passes; if it goes red, fix the root cause on the same branch.
8. **Deploy** — push and trigger the deploy for the target environment.
9. **Monitor** — watch the deploy and error stream; confirm the change is live and clean.
10. **Test** — QA against the live environment with evidence; verify each acceptance criterion.

## Parallelism rule

Run independent steps concurrently — e.g. research and graph-refresh, or two non-overlapping code areas — by dispatching multiple roles at once. Run dependent steps in sequence. **Never** parallelize work that shares mutable state. The tech-lead collects every role's result, decides, and updates the board. Ask the user before implementing anything non-trivial.
