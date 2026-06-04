---
name: graphify-team
description: Graph-first multi-role workflow. The tech-lead first builds/refreshes a knowledge graph of the codebase, uses it to scope the work and pick the files and roles that matter, then spawns the team to ship → review → deploy → monitor. Trigger with "/graphify-team", "graph team", or "graph-first". Depends on a knowledge-graph tool/skill being available.
---
# Graph-first team workflow

A variant of the team workflow where understanding the code's **shape** precedes assembling the team. **Depends on a knowledge-graph tool/skill being available** — if none is installed, fall back to the standard team workflow and say so.

Trigger phrases: `/graphify-team`, "graph team", "graph-first".

## Sequence

1. **Build / refresh the graph (tech-lead, first).** Before any role is spawned, the tech-lead runs the knowledge-graph tool over the codebase and extracts:
   - **God-nodes** — the highly-connected files; touching one has wide blast-radius.
   - **Communities** — clusters of files that change together; the natural unit of work.
   - **Blast-radius** — for the specific change in scope, what else it can reach.
2. **Scope from the graph.** Use god-nodes + community detection to decide *which files actually matter* for this task and *which roles* are needed. A change inside one community needs fewer roles than one that crosses several. Write the scope and the chosen roster to `TEAM-BOARD.md`.
3. **Spawn only the needed roles.** Assemble the team the graph implied — not a fixed roster. Independent roles run in parallel; the tech-lead stays the decision-maker.
4. **Ship.** Roles implement against the scoped files. Typecheck + build clean. Keep functions < 50 lines, try/catch on async.
5. **Review.** Run the review gate appropriate to the target (lightweight for staging, full battery for the production promotion). Block on HIGH / auth / data-correctness findings.
6. **Deploy → monitor.** Push, watch the deploy and the error stream, and confirm the change is live.
7. **Auto-fix CI/build failures.** If CI or the build goes red, read the actual failure output, fix the root cause on the same branch, and let the gate re-run in place. Do not recreate the PR.
8. **Record lessons into SKILL-DELTAS.** Capture what the graph got right or wrong, what scoping mistake to avoid next time, and any new pattern — append to a `SKILL-DELTAS` note so the workflow improves over runs.

The graph is the map; the team is the crew. Map first, crew second.
