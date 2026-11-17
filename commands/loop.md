---
description: The loop-tuned body of a long super-workflow mission — resume the baton, ship ONE bounded slice, rewrite the baton, report continue/park/stop. Driven by the built-in /loop, which owns the clock. The autonomous engine for epics, multi-bug sweeps, and migrations.
argument-hint: "[bug|feature] <mission>   (omit to resume the existing baton)"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill, Agent, Workflow, SendMessage, WebFetch, WebSearch, ScheduleWakeup, Monitor, TaskCreate, TaskList, TaskUpdate, TaskStop
---

# /super-workflow:loop

The loop-tuned **body** of a mission: resume the baton, ship ONE bounded slice, rewrite the
baton, report continue/park/stop. Use it when the work is too big for one session (an epic, a
multi-bug sweep, a migration) and you want steady unattended progress with a human gate only
where it's genuinely required.

**Canonical:** `/loop /super-workflow:loop [bug|feature] <mission>` — omit the mission to
resume the baton.

## The three parts
- **`/loop` (dynamic mode) is the pacing discipline.** There is no separate scheduler — as the
  **last action** of each firing the agent itself calls `ScheduleWakeup` with the verbatim
  `/loop /super-workflow:loop <mission>` prompt to fire the next slice, or omits it to stop.
  That call *is* the clock.
- **The baton is the memory.** `HANDOFF.md` (+ the `super-workflow-baton` memory observation,
  if a memory plugin is installed), written by `/super-workflow:handoff`. Every firing reads it
  and rewrites it. Trust the baton, not this context window — it may have been summarized or
  started cold.
- **`/super-workflow` is the hands.** The bug/feature pipelines and the 13-role team.

## Run modes (one clock only)
- **Looped (default): `/loop /super-workflow:loop <mission>`.** Each firing runs the body
  below, then calls `ScheduleWakeup` (verbatim prompt) to fire the next — or omits it to stop.
  Unattended, under the mandate below.
- **Bare (supervised step): `/super-workflow:loop <mission>`** with no `/loop`. Do exactly ONE
  chunk, update the baton, and stop — **never** call `ScheduleWakeup`. Use when a human is
  present and wants to advance it a step at a time.
One clock only — don't stack another `/loop` on top; `/loop /super-workflow:loop` already
self-paces.

## Autonomous mandate — what lets it run without a human
Unattended, there's no one to answer *"ask before implementing"* each firing, so the gate is
**pre-negotiated by risk class**. When this body spawns `/super-workflow`/tech-lead, pass the
mandate explicitly — say *"autonomous-loop mode: plan-gate pre-satisfied for auto slices; park
human-gate items and production merges."* The sub-run must NOT stall waiting for a
confirmation that won't come.

**Auto — ship every firing, no ask:** warm recall / research / logs; board + tracker
updates; baton writes; writing code on a feature/bug branch; opening **draft** PRs + pushing
them; staging deploys that are the staging branch's own automatic job; QA (live checks drive
**Playwright MCP** against staging via qa-tester), code-review, security-review, and fixing
what they surface.

**Park — never auto; record + keep going:**
- any merge to the production branch / prod promotion;
- any item in `humanGates` from `.superworkflow.json` (by default: pricing/billing, new
  top-level routes, brand/design system/launch copy, new external integrations);
- any feature whose spec doesn't trace to the project vision (route it back to the human);
- destructive/irreversible ops (data deletes, force-push, schema drops);
- outward-facing sends (email, publishing, posting);
- anything a gate **blocked** (HIGH, data-correctness MEDIUM+, auth/access-control/cross-tenant);
- genuine design forks with no safe default.

Parked items land in the baton's *Parked / needs human* list with exactly what unblocks them.
The loop does **not** stall on them — it ships autonomous slices around them.

## Loop body — every firing
0. **Resume, don't restart.** Load the baton (`HANDOFF.md`; if thin, the last memory
   baton). Unfinished mission → continue it: skip board re-init and skip warm recall **unless**
   the baton / knowledge graph is stale or the next slice touches an area not in *Findings*
   (then refresh just that). If `$ARGUMENTS` names a *different* mission than the baton's, stop
   and ask — never overwrite in-flight work. No baton and no mission → say so, stop.
1. **Pick ONE bounded slice** from *Next steps* — the smallest thing that ends in a green gate
   + a commit/PR or a concrete artifact. Too big for one firing → split it in the baton and
   take the first part.
2. **Execute** via `/super-workflow` in autonomous-loop mode (bug- or feature-pipeline per the
   baton). Fan out with the `Workflow` tool; keep findings, not raw output, in context.
3. **Gate + autonomy.** Enforce every pipeline gate; ship *auto* slices, **park** the rest.
4. **Rewrite the baton** with `/super-workflow:handoff`: update *Done*, *Next steps*,
   *Parked / needs human*, and **Loop state** (`iteration`, `mission_complete`, `next_action`,
   `suggested_wake`). Write it **before** the loop schedules — a cold firing must resume with
   zero loss.
5. **Report continue / park / stop** in your own message text — the loop's state classifier
   reads your words, not tool output — then **as your last action** call `ScheduleWakeup`
   (verbatim prompt; see Pacing) to fire the next slice, or omit it to stop (see below).

## Pacing — choosing `delaySeconds` for your ScheduleWakeup call
Cache-aware (prompt-cache TTL ≈ 5 min): **60–270s** only when actively polling external state
you can't be notified about (CI, a deploy, a preview build) — better, arm a persistent
`Monitor` so its event wakes the loop and keep the delay as a safety net. Otherwise
**1200–1800s** idle heartbeat. Never 300s (you pay the cache miss without the long wait).
Arming a Monitor up front also covers crash recovery: if a firing dies before writing the
baton, the Monitor (or just re-running `/loop /super-workflow:loop`) resumes from the last good
baton.

## Stop the loop when ANY hold (omit the next ScheduleWakeup; `TaskStop` any Monitor)
- **Mission complete** — every baton success criterion met + verified. Final baton
  `mission_complete: yes`; say `result:` + a one-line headline.
- **Fully parked** — all remaining work needs a human. Say `needs input:` naming the parked
  decisions; keep the baton warm (a human reply re-arms the loop).
- **No progress** — two consecutive firings ship nothing and add nothing to *Done*. Stop with
  `needs input:` (something's silently stuck); don't spin.
- **Ceiling hit** — a set max-iteration count or token budget is reached. Checkpoint the
  baton, stop, note where to resume.
- **Structurally blocked** — impossible as framed (wrong repo, premise false). Say `failed:`
  + the reason.

## Guardrail
One slice per firing. Tempted to do "just one more"? Write it to *Next steps* and let the next
firing take it — that's what keeps progress observable and resumable. The baton is written
before the wake, every firing, no exceptions.
