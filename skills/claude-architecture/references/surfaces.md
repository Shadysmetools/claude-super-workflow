# Surfaces — full reference

## Version gates
Check `claude --version` before recommending. Observed thresholds:

| Version | Unlocks |
|---|---|
| 2.1.129 | `${CLAUDE_SKILL_DIR}` usable in `allowed-tools` |
| 2.1.139 | `/goal` |
| 2.1.154 | Dynamic workflows |
| 2.1.186 | Background subagent permission prompts (before: auto-denied) |
| 2.1.196 | `${CLAUDE_PROJECT_DIR}`; `disable-model-invocation` blocks scheduled invocation |
| 2.1.198 | Background subagents become the default |
| 2.1.200 | `manual` alias for `default` permission mode |
| 2.1.202–203 | Workflow size guideline; ultracode; large-workflow warning |
| 2.1.206 | Sibling roster for subagents (needs `SendMessage` in tools) |
| 2.1.218 | Agent names containing `:` rejected |
| 2.1.219 | `workflowSizeGuideline` defaults to `medium` |

> **Diagnostic:** "my skill still asks permission despite an `allowed-tools` rule" is very often a
> version gate — on older versions `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PROJECT_DIR}` stay literal
> strings and the rule **never matches**.

---

## Skills

**Locations:** `.claude/skills/<name>/SKILL.md` (project), `~/.claude/skills/` (user), plugin
`skills/` or `commands/`. **Precedence: managed > user > project.** Plugin skills namespace as
`/plugin:skill`.

| Field | Notes |
|---|---|
| `name` | required, ≤64 chars, lowercase/numbers/hyphens |
| `description` | drives selection, ≤1024 chars |
| `when_to_use` | trigger phrases, appended to description; **combined truncated at 1,536 chars** |
| `argument-hint` | autocomplete hint, e.g. `[issue-number]` |
| `arguments` | named positional args for `$name` substitution |
| `allowed-tools` | e.g. `Bash(${CLAUDE_SKILL_DIR}/scripts/render.sh *)` |
| `disable-model-invocation` | `true` → manual `/name` only; **zero context cost** |
| `user-invocable` | `false` → hide from the `/` menu (background knowledge) |
| `context: fork` | run in its own subagent context |
| `agent` | which agent type executes the fork |
| `background` | `false` keeps the full foreground tool set |

**Substitutions:** `$ARGUMENTS` (full string), `$0`/`$1`… (shell-quoted — quote multi-word
values), `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`.

**`context: fork` gotchas:** only makes sense for skills with an explicit *task*. A guidelines-only
skill forks, receives no actionable prompt, and returns nothing. A backgrounded fork gets the
narrower background tool set, and **its edits land outside session checkpoints — `/rewind` will
not undo them.** Use git.

---

## Subagents

`.claude/agents/*.md`, `~/.claude/agents/`, plugin `agents/`, managed dir, or `--agents` JSON.
**Precedence: managed > CLI flag > project > user > plugin.**

**Frontmatter:** `name`, `description`, `prompt`, `tools`, `disallowedTools`, `model`,
`permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `initialPrompt`, `memory`,
`effort`, `background`, `isolation`, `color`.

- `model`: `sonnet` | `opus` | `haiku` | `fable` | full ID | **`inherit` (default)**
- `tools` omitted → inherits every subagent-available tool. **If no listed entry resolves to a
  real tool, the subagent fails to launch.**
- **To preload skills use `skills:` — not by listing `Skill` in `tools`.** This is the most
  underused field in practice.
- `name` **cannot contain `:`** (reserved for plugin scoping); such files silently do not load.
- ⚠️ **Plugin subagents silently ignore `hooks`, `mcpServers`, and `permissionMode`** for security.
  If a plugin agent "isn't respecting its permission mode", that is why — copy it into
  `.claude/agents/`.

**What loads at subagent startup:** its own system prompt (not the full Claude Code one), the
delegation message, **the whole CLAUDE.md hierarchy**, a git status snapshot, preloaded skills, and
the sibling roster (only if `SendMessage` is in tools). **The built-in `Explore` and `Plan` agents
skip CLAUDE.md and git status** to stay small — worth knowing when a forked skill mysteriously
ignores project conventions.

**Resumption:** `SendMessage` to a completed subagent auto-resumes it in the background. A
subagent *you* stopped does not auto-resume. Address by agent ID — name collisions are possible.

---

## Hooks

Shell commands, HTTP endpoints, LLM prompts, or subagents fired on lifecycle events. Configurable
in settings, plugin `hooks/hooks.json`, **and directly in skill/subagent frontmatter**.

**Hooks merge across all sources** — unlike skills/subagents/MCP, which override by name.

**Valid events:** `Setup`, `SessionStart`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`,
`PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`,
`SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`,
`TeammateIdle`, `PreCompact`, `PostCompact`, `SessionEnd`, `Elicitation`, `ElicitationResult`,
`WorktreeCreate`, `WorktreeRemove`, `Notification`, `ConfigChange`, `InstructionsLoaded`,
`CwdChanged`, `FileChanged`, `MessageDisplay`.

**Decision patterns — the wrong one means the hook silently does nothing:**

| Events | Pattern | Key fields |
|---|---|---|
| `UserPromptSubmit`, `PostToolUse`, `Stop`, `SubagentStop`, `PreCompact`, … | top-level `decision` | `decision:"block"`, `reason` |
| `PreToolUse` | `hookSpecificOutput` | `permissionDecision`: allow/deny/ask/defer, `permissionDecisionReason`, `updatedInput`, `additionalContext` |
| `PermissionRequest` | `hookSpecificOutput` | `decision.behavior`: allow/deny |
| `PermissionDenied` | `hookSpecificOutput` | `retry: true` |
| `SessionStart`, `Setup`, `SubagentStart` | context only | `additionalContext`, `initialUserMessage`, `watchPaths`, `sessionTitle` |
| `WorktreeCreate` | path return | stdout path, or `hookSpecificOutput.worktreePath` |
| `MessageDisplay` | `hookSpecificOutput` | `displayContent` — display-only; transcript keeps the original |

**Critical `PreToolUse` semantics:** returning `"allow"` skips the prompt, **but deny and ask
*rules* are still evaluated regardless.** `permissionDecisionReason` is shown to the **user** for
allow/ask, and to **Claude** for deny. `updatedInput` replaces the *entire* input object — include
unchanged fields.

**`PreToolUse` vs `PermissionRequest`:** PreToolUse runs before every tool call. PermissionRequest
runs only when Claude Code is about to prompt — **or when it would auto-deny a call it cannot
prompt for**, e.g. background subagents in non-interactive mode, where **if no hook returns a
decision, the call is denied.** This is the fix for "my headless agent keeps failing on
permissions."

**`additionalContext`** injects a string wrapped as a system reminder — visible to Claude, not a
chat message. This is how a hook *teaches* rather than blocks.

---

## MCP

**Scopes and precedence: local > project > user.**
- `local` (default, private) — `~/.claude.json` under the project path
- `project` — `.mcp.json` in repo root, shared via VCS
- `user` — `~/.claude.json`, all projects

⚠️ Trap: MCP "local scope" lives in `~/.claude.json`, **not** `.claude/settings.local.json`.

**Tool search is ON by default** — only tool *names* plus server instructions load at session
start; schemas are fetched on demand. There is **no fixed per-server tool cap**; the practical
limit is context budget. `ENABLE_TOOL_SEARCH=auto` loads schemas upfront when they fit in 10% of
context; `=false` loads everything. Per-server `alwaysLoad: true` exempts a server.

`/mcp` shows connection status **and per-server token cost**.

---

## Plugins

A plugin bundles skills, agents, hooks, MCP servers, LSP servers, workflows, output styles,
themes, monitors, and `bin/` executables.

```
my-plugin/
├── .claude-plugin/plugin.json   # manifest (name required)
├── skills/<name>/SKILL.md       # or commands/*.md (flat)
├── agents/*.md
├── workflows/*.js
├── hooks/hooks.json
├── bin/                         # added to PATH
└── settings.json, .mcp.json, .lsp.json
```

**Debug table:** plugin not loading → invalid `plugin.json` (`claude plugin validate ./my-plugin`)
· skills not appearing → `skills/` nested inside `.claude-plugin/` instead of at root · hooks not
firing → script not `chmod +x` · MCP fails → missing `${CLAUDE_PLUGIN_ROOT}` · path errors →
absolute paths used (all must be relative, starting `./`).

⚠️ **Security:** third-party plugins install hooks that run shell commands with your permissions,
and hooks **merge** rather than override. Auditing installed plugins' `hooks/hooks.json` is a
security step, not hygiene.

---

## Settings

**Scopes:** Managed > User (`~/.claude/`) > Project (`.claude/settings.json`) > Local
(`.claude/settings.local.json`).

Key keys: `permissions.{allow,ask,deny,defaultMode,additionalDirectories,disableBypassPermissionsMode}`,
`env`, `statusLine`, `agent`, `hooks`, `skillOverrides`, `claudeMdExcludes`,
`includeGitInstructions`, `disableWorkflows`, `workflowSizeGuideline`.

`/config key=value` sets one option without opening the UI.

⚠️ **Windows:** write status-line paths with forward slashes — Git Bash strips unquoted
backslashes and the command fails with no visible error.

---

## Sessions, checkpoints, worktrees

- Every message and tool result is appended to plaintext JSONL under `~/.claude/projects/`.
- **Sessions are independent** — each starts with a fresh context window. Only CLAUDE.md and auto
  memory cross the boundary.
- `--continue` / `--resume` reopen the **same** session ID. `--fork-session` / `/branch` **copy**
  history into a new ID, leaving the original intact.
- **Checkpoints are separate from git**: file contents snapshotted before each edit, `Esc Esc`
  rewinds, and they survive resume. They cover **file changes only** — remote side effects (DB,
  API, deploy) cannot be checkpointed, which is *why* Claude asks before side-effecting commands.
  Restores skip symlinked/hard-linked files.
- Parallel sessions on one repo ⇒ git worktrees.

**Steering:** `Esc` cancels the running tool call. Typing a correction and pressing Enter injects
it **without** stopping the running tool — Claude reads it when the action completes. Most users
do not know the second one.
