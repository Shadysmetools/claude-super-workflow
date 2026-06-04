# SKILL-DELTAS

This file is injected at SessionStart so each role **sharpens over time**.
Whenever a role learns something reusable — a gotcha, a convention, a fix that
should never be re-discovered — append a **dated bullet** here. From then on it
becomes standing context loaded into every future session.

Keep entries short, durable, and generic. If it only applied once, it's a note,
not a delta.

## All roles (standing rules)

- Read **TEAM-BOARD.md** first — it is the shared blackboard; act only after you know current state.
- **Bugs → main**, **features → staging** — branch and target accordingly.
- **Promote by cherry-pick** from staging to the release branch; don't merge whole long-lived branches blindly.
- **Never push to `main` directly** — open a PR; protected branch.
- **Never commit secrets** — no `.env`, keys, tokens, or credentials.
- Keep **functions < 50 lines**; prefer small, composable units.

## (append new deltas below, dated)

<!-- e.g.  - 2026-01-15 (devops): staging deploy needs the build step before restart, or PM2 serves stale assets. -->
