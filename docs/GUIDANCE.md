# Guidance — getting started & daily use

A practical walkthrough: install it, point it at your project, and run your first
bug and feature through the team.

## 1. Install

```bash
claude plugin marketplace add Shadysmetools/claude-super-workflow
claude plugin install super-workflow@claude-super-workflow
# restart Claude Code
```

## 2. Make it yours (5 minutes)

1. **`.superworkflow.json`** — copy `.superworkflow.example.json` from the plugin into
   your project root and fill in your branch names, staging/production URLs, review tools,
   human gates, tracker, and a `rulesFile`. The SessionStart hook finds it (walking up from
   the session folder) and injects a short summary every session; no config = generic mode.
2. **Project context** — list your own docs (vision, codebase map, runbook) under
   `contextFiles`; they are injected verbatim at token-zero. Alternatively edit the plugin's
   `context/VISION.md` and delete its `superworkflow:template` marker line.
3. **`agents/*.md`** — tweak the role prompts to match your stack (framework, database,
   hosting) if the defaults aren't enough.
4. **`context/CURRENT-SAAS.md`** — seed your competitors, or run `/super-workflow:saas-refresh`.
5. Apply the [recommended settings](./SETTINGS.md) (verbose, max reasoning, token gauge).

## 3. Run your first task

```bash
# a bug — goes straight to production with the full review gate
/super-workflow bug "uploads over 25MB silently fail"

# a feature — staging-first, promoted by cherry-pick
/super-workflow feature "add CSV export to the reports page"
```

The tech-lead will:
1. Create `TEAM-BOARD.md` and warm recall (knowledge graph + RAG + memory).
2. Classify the request and pick the right pipeline.
3. Assemble only the roles it needs.
4. **Present a plan and wait for your go-ahead** before writing code.
5. Drive it through the gate, QA, and (for bugs) stop at the PR for a human merge.

## 4. Useful habits

- **`update me`** any time → terse caveman status, ~75% fewer tokens.
- Watch the **status-line token gauge**; when it nears the threshold, run
  **`/super-workflow:handoff`** and start a fresh session — `/super-workflow` resumes the
  baton automatically.
- Too big for one session? **`/loop /super-workflow:loop <mission>`** ships one bounded
  slice per firing, rewrites the baton, and parks anything that needs a human.
- After a role learns something reusable, append a dated bullet to
  **`context/SKILL-DELTAS.md`** — it becomes standing context next session.
- Keep **`TEAM-BOARD.md`** as the single source of truth; every role reads it
  first and posts findings after.

## 5. The graph-first and single-task variants

- **`/graphify-team`** — build/refresh a knowledge graph *first*, use it to scope
  blast-radius and pick files/roles, then ship.
- **`/team-orchestra`** — take one task through the full lifecycle
  (analyze → research → plan → code → review → commit → build → deploy → monitor → test).

## 6. Voice (optional)

Hands-free prompting: [`scripts/voice/README.md`](../scripts/voice/README.md). Tap a
hotkey, speak in any language, get clean text in your prompt.

---

See also: [README](../README.md) · [Recommended settings](./SETTINGS.md)
