# 🎻 claude-super-workflow

**A 13-role AI engineering team for [Claude Code](https://claude.com/claude-code) — led by a tech-lead that orchestrates the whole crew, routes work into the right pipeline, and ships it end-to-end.**

> One command. A boss agent plans and asks before implementing. Specialist agents build, review, secure, QA, deploy, and monitor — all communicating through a shared blackboard. Plus session memory, a token-baton handoff for long runs, and hands-free voice dictation.

<p align="center">
  <em>⭐ If this saves you from herding a dozen one-off subagents, drop a star.</em>
</p>

<p align="center">
  <b>🚀 New here? → <a href="docs/QUICKSTART.md">60-Second Quick Start</a></b>
</p>

---

## Why this exists

Claude Code subagents are powerful but **hub-and-spoke** — they can't talk to each other, they forget context between spawns, and there's no built-in "team." You end up re-explaining the same thing to every agent.

`claude-super-workflow` turns that into an actual org:

- 🧑‍✈️ **A tech-lead with authority** — the single entry point. It plans, asks before implementing, and is the message bus every other role talks through.
- 👥 **13 specialist roles** — PM, AI/RAG engineer, full-stack, mobile, platform/architecture, devops, designer, QA, security, log/monitor, coordinator, context-expert.
- 🧠 **Shared memory** — a `TEAM-BOARD.md` blackboard + knowledge-graph + RAG recall so the team sees one source of truth.
- 🚦 **Real pipelines** — a **bug** path (straight to production, full review gate) and a **feature** path (staging-first, promote by cherry-pick).
- 🪙 **Token-baton handoff** — long sessions hand off cleanly to a fresh one with zero context loss.
- 🎙️ **Voice dictation** — tap a hotkey, speak (any language), get clean text in your prompt.

---

## Quick start

```bash
# 1. Add this repo as a plugin marketplace
claude plugin marketplace add Shadysmetools/claude-super-workflow

# 2. Install
claude plugin install super-workflow@claude-super-workflow

# 3. Restart Claude Code, then run:
/super-workflow feature "add a dark-mode toggle to settings"
```

The tech-lead initializes the team blackboard, warms recall, classifies the request, assembles only the roles it needs, presents a plan, and (after your go-ahead) drives it through the pipeline.

---

## The commands

| Command | What it does |
|---|---|
| `/super-workflow [bug\|feature] <description>` | Main entry. Routes to the right pipeline and drives the team. Omit the type and it asks. |
| `/super-workflow:handoff` | Writes a **token-baton** so a fresh session resumes with zero loss. |
| `/super-workflow:saas-refresh` | Browses competitors via a headless browser and refreshes the competitive snapshot. |
| `update me` | Tech-lead replies in **caveman mode** — terse status, ~75% fewer tokens. |

---

## The 13 roles

| Role | Owns |
|---|---|
| **tech-lead** (boss) | Orchestration, decisions, plan-gate, message bus, keeps the blackboard. |
| **ai-pm** | Specs, prioritization, acceptance criteria, impact/effort. Read-only on code. |
| **ai-engineer** | LLMs, embeddings, vector search, RAG, prompts, transcription. |
| **full-stack** | Frontend + backend implementation: UI, hooks, routes, services. |
| **mobile-dev** | React Native / Expo, native builds, OTA, device QA. |
| **platform-engineer** | Architecture, scaling, data modeling, migration ordering, perf budgets. |
| **devops** | Deploys, process managers, CI/CD, secrets, hosting config. |
| **designer** | Competitive UX research, flows, design-system fit. |
| **qa-tester** | Evidence-based QA via headless + real browser. No sign-off without proof. |
| **security-expert** | Auth, access control, secrets, input validation, the security review pass. |
| **log-admin** | Watches logs, CI, deploy bots, review bots; raises incidents. |
| **project-coordinator** | Keeps the blackboard clean, tracks blockers, maintains the baton. |
| **claude-context-expert** | Context engineering, prompt/skill quality, the per-session skill-up. |

---

## How the agents communicate

Built from four mechanisms, with a shared blackboard as the truth:

1. **Tech-lead message bus** — every role reports to the tech-lead, who relays.
2. **`SendMessage`** — resume a previously spawned role *with its context* for real back-and-forth (reviewer → dev → reviewer).
3. **`Workflow` tool** — deterministic parallel fan-out / pipeline; structured outputs feed the next stage.
4. **`TEAM-BOARD.md`** + durable recall (knowledge graph + RAG + cross-session memory).

`TEAM-BOARD.md` is created per run with sections for Goal, Roster, Decisions, Open questions, Blockers, Findings, and Next steps. Every role **reads it first** and **posts findings after** — and routes questions to other roles through the tech-lead.

---

## The two pipelines

### 🐛 Bug pipeline → production
Investigate (logs + graph) → root-cause vs architecture → plan (**ask the user**) → branch off `main` → code → **full review gate** (code-review bot + diff-analysis + security review) → QA with evidence → open PR → **stop for human merge** → deploy + monitor.

### ✨ Feature pipeline → staging first
Deep research (top repos by stars, transcribe a YouTube URL) → spec → plan (**ask the user**) → branch → build → **lightweight staging gate** → QA in a real browser → **promote to production by cherry-pick only** → full gate on the promotion PR → deploy + monitor.

> Branch targets, gate strictness, and deploy hosts are all configurable — see `context/` and the skill files. Ships with sensible placeholders (`origin/main`, `<your-staging-branch>`, `$DEPLOY_HOST`).

---

## Session ritual — the team "levels up" every session

A `SessionStart` hook injects three things at token-zero so the crew is always current:

1. **`context/VISION.md`** — your product thesis (so every agent shares the goal).
2. **`context/CURRENT-SAAS.md`** — the competitive landscape (refresh with `/saas-refresh`).
3. **`context/SKILL-DELTAS.md`** — per-role "what improved / focus this session." Append a dated bullet whenever a role learns something reusable and it becomes standing context.

---

## 🎙️ Voice dictation (bonus)

A tiny background listener: tap a hotkey, speak in **any language**, and clean text is auto-pasted wherever your cursor is. Uses [Groq Whisper](https://groq.com) in *translate* mode so mixed-language speech comes out as clean English.

```bash
# one-time
setx GROQ_API_KEY "gsk_..."          # Windows  (export on macOS/Linux)
pip install -r scripts/voice/requirements.txt

# run (Windows)
powershell -File scripts/voice/voice-dictation.ps1
# tap F9 to start/stop, Esc to quit
```

See [`scripts/voice/README.md`](scripts/voice/README.md). Configurable via `VOICE_HOTKEY`, `VOICE_TASK` (`translate`/`transcribe`), `VOICE_LANG`.

---

## Repo layout

```
.claude-plugin/   plugin.json + marketplace.json
agents/           the 13 role definitions
commands/         /super-workflow, handoff, saas-refresh
skills/           bug-pipeline, feature-pipeline, team-blackboard,
                  graphify-team, team-orchestra
hooks/            session-start, prompt-hook, precompact (+ hooks.json)
context/          VISION / CURRENT-SAAS / SKILL-DELTAS templates
scripts/voice/    hotkey voice dictation (Groq Whisper)
```

---

## ⚙️ Recommended settings

For the best experience, tune `~/.claude/settings.json` — **maximum reasoning for planning**, full tool-output visibility, and a **live token gauge** in your status line:

```jsonc
{
  "verbose": true,                 // see full tool output
  "effortLevel": "xhigh",          // plan mode at MAX (deepest reasoning)
  "alwaysThinkingEnabled": true,   // extended thinking every turn
  "autoCompactEnabled": true,
  "autoCompactWindow": 256000,     // token-limit window before auto-compact
  "statusLine": {                  // ⚡ model ▸ folder | ~Nk tok (P% of 256k) | $cost
    "type": "command",
    "command": "node \"<path-to-plugin>/scripts/statusline.cjs\""
  }
}
```

The status line shows how close you are to the handoff threshold; when you near it, run `/super-workflow:handoff` to pass a clean **token-baton** to a fresh session. Full rationale + every setting explained → **[docs/SETTINGS.md](docs/SETTINGS.md)**.

## Customizing for your project

1. Edit `context/VISION.md` with your product thesis.
2. Replace the placeholders in `skills/bug-pipeline` and `skills/feature-pipeline` (branch names, deploy host, which review tools you run).
3. Tweak the agent prompts in `agents/` to match your stack.
4. Seed `context/CURRENT-SAAS.md` with your competitors.
5. Apply the [recommended settings](docs/SETTINGS.md).

📖 **New here? Start with the [Getting-started & daily-use guide → docs/GUIDANCE.md](docs/GUIDANCE.md).**

---

## 🤝 Built alongside Knowcap

This workflow was forged building [**Knowcap**](https://knowcap.ai) — *the trust layer for AI agents: every fact an agent acts on is confirmed by a named human, with a full audit trail.*

The two fit together naturally: **Knowcap is where your team's confirmed facts live** (from meetings, docs, and chat), and this workflow is **the AI team that acts on them**. If you want your agents working from a source of truth a human has actually verified — not just whatever they scraped — point them at Knowcap via its MCP server.

> 👉 Learn more / try it: **[knowcap.ai](https://knowcap.ai)**

*(This repo is a standalone, project-agnostic framework — it works great on its own. Knowcap is the recommended fact/memory layer behind it.)*

---

## Contributing

PRs welcome — new roles, new pipelines, better recall wiring, non-Windows voice launchers. Open an issue to discuss bigger changes.

## License

[MIT](LICENSE) © 2026 Shady (@Shadysmetools)

---

<p align="center"><sub>Built with Claude Code. If it helped, a ⭐ goes a long way.</sub></p>
