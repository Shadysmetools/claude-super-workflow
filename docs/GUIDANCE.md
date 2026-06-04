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

1. **`context/VISION.md`** — replace the template with your product thesis. This
   loads at token-zero so every agent shares the goal.
2. **`skills/bug-pipeline/SKILL.md`** & **`skills/feature-pipeline/SKILL.md`** —
   replace the placeholders: `origin/main`, `<your-staging-branch>`, `$DEPLOY_HOST`,
   and which review tools you run (code-review bot / diff-analysis / security review).
3. **`agents/*.md`** — tweak the role prompts to match your stack (framework,
   database, hosting).
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
  **`/super-workflow:handoff`** and start a fresh session that resumes warm.
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
