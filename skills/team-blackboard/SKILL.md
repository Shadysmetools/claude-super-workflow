---
name: team-blackboard
description: Use to set up and run the shared communication substrate for a multi-role agent workflow. Explains the hub-and-spoke message model (tech-lead bus, SendMessage, Workflow fan-out) and the TEAM-BOARD.md durable board every role reads before and writes after its turn, plus how durable recall plugs in.
---
# Team Blackboard — how the agents communicate

Subagents are **hub-and-spoke**: spawned roles cannot talk to each other directly. The
tech-lead (the main agent) is the hub; every message routes through it. The blackboard makes
that coordination durable across turns and sessions.

## Four communication mechanisms

1. **Tech-lead message bus.** The main agent is the single router. Roles report up; the
   tech-lead decides and dispatches down. No role addresses another role directly.
2. **`SendMessage` — resume a role with its context.** To continue a role's work (e.g.
   reviewer → full-stack → reviewer), resume the previously spawned agent instead of
   re-spawning cold and re-explaining.
3. **`Workflow` tool — deterministic parallel fan-out.** When tasks are independent, dispatch
   roles at once; their structured outputs feed the next stage. One nesting level; the
   tech-lead owns it. Use only when there is no shared mutable state between the tasks.
4. **`TEAM-BOARD.md` + durable recall.** The board is the source of truth across turns.
   Back it with a knowledge graph (structure), RAG over the repo (content), and cross-session
   memory (history — also where the `/super-workflow:handoff` baton is mirrored).

## The contract every role follows

- **Read first.** Before acting, read `TEAM-BOARD.md` (at least Goal, Decisions, Blockers,
  your Findings heading) and search recall for prior context.
- **Post after.** Append results under your own Findings heading and update your status in
  the Roster. Raise blockers and open questions. **Never overwrite another role's section.**
- **Route through the tech-lead.** To "ask" another role, write the question under *Open
  questions* tagging that role; the tech-lead relays / spawns / `SendMessage`s.
- **Project-coordinator** keeps the board clean, converts relative dates to absolute ones,
  and surfaces blockers.

## Warm-recall ritual (before any non-trivial planning)

1. Refresh the **knowledge graph** if one is installed (e.g. `/graphify --update`) — surface
   god-nodes, the communities the task touches, and the blast-radius of the change.
2. **Index + RAG-search** the relevant files (e.g. context-mode `ctx_index` + `ctx_search`)
   for the exact behavior in scope, similar past changes, and gotchas.
3. **Search cross-session memory** (e.g. claude-mem) for prior decisions on this area.
4. **Cite** what you found under *Findings*. A plan that ignored the graph / RAG is not ready.

## TEAM-BOARD.md template

```markdown
# TEAM-BOARD — <request one-liner>
Updated: <absolute date/time> · Route: bug→production | feature→staging

## Goal
<the objective in one line>

## Roster
| Role | Task | Status |
|------|------|--------|
| tech-lead | route + decide | active |
| <role> | <task> | queued / active / blocked / done |

## Decisions
- <decision> — by <role> — <rationale> — <date>

## Open questions  (→ routed via tech-lead)
- <question> — owner <role> — answer: <…>

## Blockers
- <blocker> — needs <who/what> (incl. human actions: dashboard / secrets / approval)

## Findings  (each role appends under its own heading)
### <role> @ <time>
- <finding with file:line or source citation>

## Next steps
1. <next concrete action>
```

Keep the board terse and current — it is the team's single source of truth. It is runtime
state: keep it out of git (it is in `.gitignore`).
