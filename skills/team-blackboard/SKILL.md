---
name: team-blackboard
description: Use to set up and run the shared communication substrate for a multi-role agent workflow. Explains the hub-and-spoke message model and the TEAM-BOARD.md durable board every role reads before and writes after its turn.
---
# Team Blackboard — how the agents communicate

Subagents are **hub-and-spoke**: spawned roles cannot talk to each other directly. The tech-lead (the main agent) is the hub; every message routes through it. The blackboard makes that coordination durable across turns and sessions.

## Four communication mechanisms

1. **Tech-lead message bus.** The main agent is the single router. Roles report up; the tech-lead decides and dispatches down. No role addresses another role directly.
2. **Resume-a-role with context.** To continue a role's work, send it a message carrying the context it needs (the relevant board sections + the specific ask) rather than re-spawning cold.
3. **Parallel fan-out.** When tasks are independent, dispatch multiple roles at once and collect their results. Use this only when there is no shared mutable state between the tasks.
4. **TEAM-BOARD.md + durable recall.** The board is the source of truth across turns. Back it with durable recall: a knowledge graph (structure), RAG over the repo (content), and cross-session memory (history).

## The contract every role follows

- **Read first.** Before acting, read `TEAM-BOARD.md` (at least Goal, your Findings heading, Decisions, Blockers).
- **Post after.** After acting, write your results under your Findings heading and update your status in the Roster.
- **Route through the tech-lead.** Open questions go to the tech-lead, who assigns them to the right role — never role-to-role.

## Warm-recall ritual (before any non-trivial planning)

1. Refresh the **knowledge graph** — surface god-nodes, communities, and the blast-radius of the change.
2. **Index + RAG-search** the relevant files for the exact behavior in scope.
3. **Search cross-session memory** for prior decisions on this area.
4. **Cite** what you found in the plan, so the next role can trust it.

## TEAM-BOARD.md template

```markdown
# TEAM-BOARD

## Goal
<one-paragraph statement of what this session is shipping>

## Roster
| Role | Task | Status |
|------|------|--------|
| tech-lead | route + decide | active |
| <role> | <task> | todo / in-progress / blocked / done |

## Decisions
- <decision> — <rationale> — <date>

## Open questions
- <question> → routed to <role> via tech-lead

## Blockers
- <blocker> — owner — needs

## Findings
### <role>
- <finding with file:line or source citation>

## Next steps
1. <next concrete action>
```
