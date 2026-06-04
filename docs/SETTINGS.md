# Recommended Claude Code settings

These tune Claude Code to get the most out of the super-workflow team: maximum
reasoning for planning, full tool-output visibility, a live token gauge, and a
sane auto-compact window. All of these live in your **`~/.claude/settings.json`**
(global) — merge them with whatever you already have; don't replace the file.

```jsonc
{
  // See full tool output instead of truncated summaries — useful with a
  // multi-agent team so you can watch what each role actually did.
  "verbose": true,

  // Maximum reasoning effort. Makes plan mode (and every turn) think as deeply
  // as the model allows — "plan mode at MAX". Levels: low → medium → high → xhigh.
  "effortLevel": "xhigh",

  // Keep extended thinking on for every turn, not just planning.
  "alwaysThinkingEnabled": true,

  // Token gauge in your status line: shows model, folder, ~tokens used, % toward
  // the handoff threshold, and session cost. (Path is relative to this plugin.)
  "statusLine": {
    "type": "command",
    "command": "node \"<path-to-plugin>/scripts/statusline.cjs\""
  },

  // Token "limit" / auto-compact window. When the context fills toward this many
  // tokens, Claude Code auto-compacts. Pair it with the token-baton (below) so a
  // long session can hand off cleanly instead of silently losing context.
  "autoCompactEnabled": true,
  "autoCompactWindow": 256000,

  // OPTIONAL — skip permission prompts (only if you trust the workspace).
  // Remove this if you want to approve each action.
  "permissions": { "defaultMode": "bypassPermissions" }
}
```

## What each one does

| Setting | Effect |
|---|---|
| `verbose: true` | Shows full tool output — you see exactly what every role did. |
| `effortLevel: "xhigh"` | **Max reasoning** — deepest planning. The top of `low/medium/high/xhigh`. |
| `alwaysThinkingEnabled: true` | Extended thinking on for every turn. |
| `statusLine` | Live status: `⚡ model ▸ folder \| ~Nk tok (P% of 256k) \| $cost`. |
| `autoCompactEnabled` / `autoCompactWindow` | The token-limit window before auto-compaction. |
| `permissions.defaultMode` | `bypassPermissions` = no prompts (optional, trust-dependent). |

## Token limit → handoff

The status line shows how close you are to the **handoff threshold**
(`SUPERWF_HANDOFF_BYTES`, default ≈ 256k tokens). When you get near it:

```
/super-workflow:handoff
```

writes a structured **token-baton** (goal, open work, decisions, blockers, next
steps, board pointer) so a fresh session resumes with zero context loss. The
`UserPromptSubmit` hook also nudges you automatically as the transcript grows.

> Tip: after editing `settings.json`, **restart Claude Code** for the changes to
> take effect.
