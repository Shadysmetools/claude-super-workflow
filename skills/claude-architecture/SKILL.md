---
name: claude-architecture
description: Expert knowledge of Claude Code itself - the agent loop, context and compaction, permissions, sessions, and every extensibility surface (skills, subagents, hooks, MCP, plugins, output styles, workflows, agent teams). Its core job is CHOOSING - given a real setup and a real frustration, which surface is correct and why. Includes a concrete setup-audit procedure and the multi-agent patterns with their failure modes and costs.
when_to_use: Claude Code, skill, SKILL.md, subagent, agent, hook, PreToolUse, PostToolUse, SessionStart, MCP server, plugin, marketplace, settings.json, permissions, allowlist, output style, statusline, CLAUDE.md, context window, compaction, workflow, ultracode, agent team, loop, /goal, routine, scheduled task, worktree, checkpoint, rewind, model selection, effort, orchestration, fan-out, multi-agent, audit my setup, which skill should I use, why is my hook not firing, why does it keep asking permission.
user-invocable: true
---

# Claude Code architecture — and how to choose

Verified against Anthropic's official docs on 2026-07-29. **The docs moved to
`code.claude.com/docs/en/*`**; old `docs.claude.com/en/docs/claude-code/*` paths redirect. Append
`.md` to any doc URL for clean markdown.

- `references/surfaces.md` — full frontmatter, hook events, decision patterns, gotchas
- `references/orchestration.md` — multi-agent patterns, workflow limits, loop engineering, models

---

## Two things that will silently corrupt your advice

**1. Slash commands and skills are one surface now.** `/claude-code/slash-commands` redirects to
the Skills page. A skill is invocable as `/skill-name`, and `$ARGUMENTS`, `argument-hint`,
`arguments`, and `allowed-tools` are all *skill* frontmatter. Advice that treats
`.claude/commands/*.md` and `.claude/skills/*/SKILL.md` as different systems is stale.

**2. Almost every surface is version-gated.** Run `claude --version` before recommending anything.
Key thresholds are listed in `references/surfaces.md`.

---

## The choosing algorithm

Ask in this order. The **first** yes wins.

**1. Must it happen every time, regardless of whether the model cooperates?** → **Hook.**

This is the highest-value distinction and the one most often got wrong. From the official docs:

> *"An instruction like 'never edit `.env`' in CLAUDE.md or a skill is a request, not a guarantee.
> A `PreToolUse` hook that blocks the edit is enforcement."*

Reinforced twice more: *"Permission rules are enforced by Claude Code, not by the model"*
(permissions) and *"Claude treats them as context, not enforced configuration"* (memory).

So: **a CLAUDE.md rule the model keeps violating is not a wording problem. It is the wrong
surface.** Rewriting it more emphatically will not fix it.

**2. Does it need its own context window?** → **Subagent** (or agent team / workflow at scale).

**3. Is it a new tool, external system, or authenticated data source?** → **MCP server.**

**4. Is it knowledge or a procedure to pull in when relevant?** → **Skill** — or CLAUDE.md if it
is genuinely needed *every* session.

---

## Trigger table — keyed on what you can observe

| Observed | Recommend | Because |
|---|---|---|
| Claude gets a convention wrong twice | CLAUDE.md entry | Loaded every session |
| Same prompt typed repeatedly | User-invocable skill | Becomes `/name` |
| Same multi-step playbook pasted a third time | Skill | Description loads; body does not until used |
| Copying data from a tab Claude cannot see | MCP server | Connection + auth handled |
| Many file reads just to find a symbol | Code-intelligence (LSP) plugin | Often *net negative* context |
| A side task floods the conversation | Subagent | Separate window; only the summary returns |
| "I want this to happen every time" | Hook | Trigger is guaranteed |
| A CLAUDE.md rule violated anyway | **PreToolUse hook** | Prompts are advisory; hooks are enforced |
| CLAUDE.md over ~200 lines | Split into `.claude/rules/` with `paths:` | Path-scoped rules load only when relevant |
| Approving the same safe command 20×/day | `permissions.allow` rule | Cheapest fix — **not** a hook |
| Parallel work touching the same files | Worktrees (`--worktree`, subagent `isolation`) | Agent teams do **not** isolate teammates |
| Re-prompting "keep going" until a condition holds | `/goal` | A fast model checks the condition each turn |
| Polling something by hand | `/loop`, or Routines if it must outlive the session | |
| Must run when the machine is off | Routines | Anthropic-managed infra |
| Changing Claude's *role*, not its knowledge | Output style | Replaces the system prompt — high cost, never compacted |
| Orchestration that should be rerunnable, dozens of agents | Dynamic workflow | The *script* holds the plan |

---

## Context cost — for auditing a bloated setup

| Surface | Loads | Cost |
|---|---|---|
| CLAUDE.md | Session start, full | **Every request** |
| Skills | Descriptions at start; body on use | Low |
| MCP servers | Tool *names*; schemas on demand | Low until used |
| Subagents | Fresh context when spawned | Isolated |
| **Hooks** | On trigger | **Zero** unless they return output |

**The lever most people miss:** `disable-model-invocation: true` drops a skill's cost to **zero**
until manually invoked. Anthropic explicitly recommends it for **any skill with side effects**.
For skills you did not write, `skillOverrides` in settings does the same without editing the file.

When context fills, Claude Code clears **older tool outputs first**, then summarizes. Requests and
key snippets survive; **detailed instructions from early in the conversation may not**. That is
the argument for putting durable rules in CLAUDE.md rather than in conversation.

---

## Permission evaluation order — get this exactly right

> *"Rules are evaluated in order: deny, then ask, then allow. The first match in that order
> determines the outcome, and rule specificity doesn't change the order."*

Three consequences worth checking in any real `settings.json`:

- **A broad deny cannot carry allowlist exceptions.** `Bash(aws *)` in deny blocks
  `Bash(aws s3 ls)` even if that exact string is in allow.
- **A matching `ask` beats a narrower `allow`.** It will still prompt.
- **A bare tool name in deny removes the tool from Claude's context entirely** — Claude never sees
  it. `Bash(rm *)` instead leaves the tool available and blocks matching calls.

Glob note: in permission rules, tool-name globs work only after a literal `mcp__<server>__`
prefix; the server segment itself cannot be a glob.

---

## Setup-audit procedure

Run in this order when asked "audit my setup" or "which skill should I use".

1. **`claude --version`** — gate every recommendation on it.
2. **`/context` and `/mcp`** — where is context actually going? `/mcp` prints per-server token
   cost, the single best diagnostic for a bloated setup.
3. **CLAUDE.md length.** Over 200 lines → split into `.claude/rules/` with `paths:` frontmatter.
   Look for **contradictory rules** across the hierarchy — if two rules conflict, Claude may pick
   one arbitrarily.
4. **Skill descriptions.** Vague, first-person, very short, or overlapping → selection failures.
   The description is what Claude uses to choose among 100+ skills; it is the highest-leverage
   field in the whole system.
5. **Side-effecting skills without `disable-model-invocation: true`** → context waste plus
   accidental invocation.
6. **Skill bodies over 500 lines** → progressive-disclosure split.
7. **Hook event-name casing** against the official list. ⚠️ Before flagging: check whether the
   file lives in a **per-harness config directory** (`configs/cursor/`, `configs/copilot-cli/`,
   `cursor-hooks/`). Cross-platform plugins ship configs for other agent harnesses using *their*
   event names. Those are correct where they are and Claude Code never loads them. Only flag
   invalid keys in a hooks.json Claude Code actually reads.
8. **`settings.json` permissions** — broad denies shadowing intended allows; `ask` shadowing
   `allow`; bare tool names in deny.
9. **Subagent frontmatter** — is `skills:` (preloading) or `isolation:` being used? These are the
   two most-underused fields in practice and usually the biggest available win.
10. **Duplicate methodologies** — a forked and an upstream copy of the same skill both loaded.
11. **For each stated frustration, ask once:** "does this need to happen every time?" If yes and
    it is currently a CLAUDE.md line or a skill, the answer is a hook.

---

## Skill authoring — the rules that matter

**The description drives selection. Write it in third person.** It is injected into the system
prompt; mixed point-of-view causes discovery problems.

- ✅ *"Processes Excel files and generates reports"*
- ❌ *"I can help you process Excel files"* / *"You can use this to process Excel files"*

Include **what it does and when to use it**, with specific trigger terms. **Put the key use case
first** — `description` + `when_to_use` are truncated at **1,536 chars** in the listing.

Other hard rules:
- `name` ≤64 chars, lowercase/numbers/hyphens. `description` ≤1,024 chars.
- **Keep SKILL.md under 500 lines.** It is a table of contents, not the manual — push depth into
  reference files.
- **Match degrees of freedom to fragility.** Prose heuristics when several approaches are valid;
  exact steps or a script when the task must be identical every time.
- **Write for a capable reader.** Do not explain what Claude already knows.
- **In scripts, solve — do not defer.** Handle errors in code rather than bouncing them back.

Anti-patterns: time-sensitive content (*"if you're doing this before August 2025…"*), Windows-style
backslash paths (always forward slashes), vague overlapping descriptions, guidelines-only skills
with `context: fork` (the subagent gets rules and no task, and returns nothing).

**Iterate from observation.** Repeated reads of the same reference file mean that content belongs
in SKILL.md. Never-accessed files are unnecessary or poorly signposted. When Claude goes off track
using a skill, ask it to reflect on what went wrong and fold the answer back in.
