# Orchestration, loops, and models

## The four parallelism surfaces — "who holds the plan"

| | Subagents | Skills | Agent teams | Workflows |
|---|---|---|---|---|
| What it is | A worker Claude spawns | Instructions Claude follows | A lead supervising peer sessions | **A script the runtime executes** |
| Who decides what runs next | Claude, turn by turn | Claude, following the prompt | The lead, turn by turn | **The script** |
| Intermediate results live in | Claude's context | Claude's context | A shared task list | **Script variables** |
| What is repeatable | The worker definition | The instructions | The team definition | **The orchestration itself** |
| Scale | A few per turn | Same | A handful of long-running peers | **Dozens to hundreds per run** |
| Interruption | Restarts the turn | Restarts the turn | Teammates keep running | **Resumable in-session** |

Routing questions: *Who coordinates?* (Claude in one conversation → subagents; you, checking back
later → agent view; Claude planning and supervising → agent teams; a script → workflows.)
*Do workers need to talk to each other?* (only agent teams). *Do tasks touch the same files?*
(→ worktrees — **agent teams do not isolate teammates; partition file ownership manually**).

---

## Economics — Anthropic's own numbers

> **Single agents ≈ 4× the tokens of chat. Multi-agent systems ≈ 15× the tokens of chat.**
> *"For economic viability, multi-agent systems require tasks where the value of the task is high
> enough to pay for the increased performance."*

**The best "don't fan out" citation:**

> *"Domains that require all agents to share the same context or involve many dependencies between
> agents are not a good fit... most coding tasks involve fewer truly parallelizable tasks than
> research, and LLM agents are not yet great at coordinating and delegating to other agents in
> real time."*

Good fit = heavy parallelization **and** information exceeding one context window **and** many
complex tools.

**Observed failure modes:** spawning 50 subagents for a simple query; endlessly scouring for
nonexistent sources; agents distracting each other with excessive updates.

**Delegation quality is the lever.** Every subagent needs *an objective, an output format,
guidance on tools/sources, and clear task boundaries*. Without them agents duplicate work or leave
gaps — Anthropic's own example had one subagent research the 2021 chip crisis while two others
duplicated 2025 supply-chain work.

**Errors compound in stateful long runs.** Restarting from zero is expensive, so resume from the
failure point, tell the agent when a tool is failing and let it adapt, and combine model
adaptability with **deterministic safeguards: retry logic and regular checkpoints.**

> *"The most successful implementations use simple, composable patterns."* Start with the simplest
> thing; add agents only when it demonstrably pays.

---

## Pattern catalogue

| Pattern | For | Failure mode |
|---|---|---|
| **Prompt chaining** | Fixed sequential steps, each gated | Latency; rigid if not decomposable |
| **Routing** | Classify, dispatch to a specialist | Misrouting on vague descriptions |
| **Parallel sectioning** | Independent subtasks at once | Duplicated or gapped work from vague delegation |
| **Voting / judge panel** | Same task N times for confidence | N× cost; correlated errors if all share a prompt bias |
| **Orchestrator-workers** | Subtasks not predictable up front | Coordination cost grows fast; lead becomes bottleneck |
| **Evaluator-optimizer** | Clear criteria + iteration pays | Infinite polish — needs a hard round cap |
| **Adversarial verification** | Suppressing false positives | Over-refutation. ⚠️ A refuter that re-checks the same pre-state as the verifier adds **no** independent evidence |
| **Pipeline-until-pass** | Fix until a checker is green | Thrash — always pair with a **no-progress cutoff** |
| **Loop-until-dry** | Search rounds until nothing new | Premature stop on one bad round |
| **Barrier / fan-in** | All workers finish, then synthesize | Slowest worker gates everything |

**Dedup against everything seen, not against what survived judging** — otherwise judge-rejected
findings reappear every round and the loop never converges.

---

## Dynamic workflows

A JavaScript script Claude writes, executed by a runtime in the background. Triggered by the
keyword `ultracode`, by natural language ("use a workflow"), or `/effort ultracode`.

**Hard limits — the runaway guardrails:**
- **16 concurrent agents** (fewer on low-core machines)
- **1,000 agents total per run** — explicitly *"Prevents runaway loops"*
- **No mid-run user input.** Only agent permission prompts pause a run. **For sign-off between
  stages, run each stage as its own workflow.**
- **No direct filesystem/shell access from the script** — agents act, the script coordinates
- Advisory warning at >25 agents or >1.5M projected tokens
- Size guideline (`workflowSizeGuideline`): `small` <5, `medium` <15 (**default**), `large` <50,
  `unrestricted` — advice to Claude, **not a cap**

⚠️ **Permission semantics are surprising:** the launch prompt follows your session mode, **but the
subagents a workflow spawns always run in `acceptEdits` and inherit your tool allowlist regardless
of session mode. File edits are auto-approved.** Shell/web/MCP calls outside the allowlist still
prompt mid-run — **allowlist before a long run** or it stalls.

⚠️ **Resume semantics — the non-obvious cost rule:** replay follows **agent start order**. Cached
results stop at the **first agent that did not finish**, and **every agent that started after it
re-runs even if it completed.** ⇒ **Fan-out across many small agents preserves far more progress
than one long agent.** Resume works only within the same session.

**`Date.now()` / `Math.random()` / argless `new Date()` throw inside workflow scripts** — they
would break deterministic resume. Pass timestamps via `args`; stamp results after the run.

---

## Agent teams (experimental)

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Teammates have their own context windows and
message each other directly.

**Limitations to quote before recommending:** `/resume` and `/rewind` do not restore in-process
teammates (the lead may message ghosts) · task status can lag and block dependents · shutdown is
slow · **one team per session, no nesting** · **the lead is fixed** for the session · in-process
teammates cannot spawn background subagents.

---

## Loop engineering

| Primitive | Lifetime | Use for |
|---|---|---|
| **`/goal`** | Until the condition holds — a fast model checks each turn | Condition-driven: "until CI is green" |
| **`/loop [interval]`** | Session-scoped; can be self-paced and can end itself | Polling a deploy, babysitting a PR |
| **Routines** | Independent of any session; **runs when your computer is off**; API- and GitHub-event-triggerable | Morning PR review, overnight analysis |
| **Desktop scheduled tasks** | Local machine, on a schedule | Needs local files/tools |

**`loop.md`:** `.claude/loop.md` (project, wins) or `~/.claude/loop.md`. Plain markdown. **Edits
take effect on the next iteration**, so a running loop can be tuned. **Truncated beyond 25,000
bytes.**

**Event-driven beats polling** — Channels let CI/webhooks push into a session directly. Prefer
that over `/loop` whenever an event source exists.

**Budgets:** task budgets give an advisory token budget for the full agentic loop with a running
countdown the model sees. Documented pitfall: *"Set a generous budget and let the model
self-regulate against the countdown rather than trying to mirror it client-side."*

**Handoff / baton patterns** are practitioner vocabulary, **not Anthropic terminology** — say so.
The mechanisms are official: `Stop`/`SubagentStop` hooks accept `additionalContext` for
"not done yet, here's what's missing"; **`PostCompact` receives `compact_summary`** (the hook point
for writing a durable baton at the moment context is lost); `SessionStart` accepts
`initialUserMessage` / `additionalContext` (reading it back); auto memory `MEMORY.md` carries
across sessions but **only the first 200 lines / 25KB load**, so a baton must be small and
top-loaded.

**Verification before completion**, weakest → strongest:
1. CLAUDE.md instruction — advisory, **may be lost after compaction**
2. A `/verify` skill — Claude must choose to invoke it
3. **`Stop` hook returning `decision:"block"` with a reason** — deterministic; **the only real
   "cannot claim done without evidence" mechanism**
4. `PreToolUse` hook on the commit/push command — blocks the artifact of a false claim

**Runaway checklist:** every loop needs a termination predicate **and** a no-progress predicate ·
prefer fan-out over one long agent · stage sign-off means separate workflows · allowlist before
long runs · for headless/background, install a `PermissionRequest` hook or non-promptable calls
are auto-denied.

---

## Models

| | **Fable 5** | **Opus 5** | **Sonnet 5** | **Haiku 4.5** |
|---|---|---|---|---|
| For | Long-running agents | **Complex agentic coding** | Speed/intelligence balance | Fastest, near-frontier |
| ID | `claude-fable-5` | `claude-opus-5` | `claude-sonnet-5` | `claude-haiku-4-5-20251001` |
| Context | 1M | 1M | 1M | 200k |
| Cutoff | Jan 2026 | **May 2026** | Jan 2026 | Feb 2025 |

**Official default:** start with **Opus 5** for complex agentic coding; use **Fable 5** when you
need the highest available capability.

| Situation | Pick |
|---|---|
| Main session, complex multi-file coding | **Opus 5** |
| Very long autonomous runs | **Fable 5** |
| Agent-team teammates / coordination | **Sonnet** — Anthropic's explicit cost guidance |
| High-volume mechanical subagents | **Haiku 4.5** |
| Plan strong, execute cheap | **`opusplan`** alias |
| Subagent should track the session | **`model: inherit`** (the default) |

⚠️ **From the 4.6 generation onward, dateless model IDs are still pinned snapshots, not evergreen
pointers.** Common and expensive misconception. Fable 5 uses the Opus 4.7 tokenizer, so the same
text produces **~30% more tokens** — it matters for budget math.

**Workflow cost note:** every agent in a workflow uses the **session's** model unless the script
routes a stage otherwise or `CLAUDE_CODE_SUBAGENT_MODEL` is set (which overrides both). Check
`/model` before a large run.
