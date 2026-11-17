# SKILL-DELTAS

This file is injected at SessionStart so each role **sharpens over time**.
Whenever a role learns something reusable — a gotcha, a convention, a fix that
should never be re-discovered — append a **dated bullet** here. From then on it
becomes standing context loaded into every future session.

Keep entries short, durable, and generic. If it only applied once, it's a note,
not a delta.

## All roles (standing rules)

- Read **TEAM-BOARD.md** first — it is the shared blackboard; act only after you know current state.
- **Bugs → production branch**, **features → staging branch** (names from `.superworkflow.json`) — branch and target accordingly.
- **Promote by cherry-pick** from staging to the release branch; don't merge whole long-lived branches blindly.
- **Never push to the production branch directly** — open a PR; protected branch.
- **Never commit secrets** — no `.env`, keys, tokens, or credentials.
- Keep **functions < 50 lines**; prefer small, composable units.

## (append new deltas below, dated)

<!-- e.g.  - 2026-01-15 (devops): staging deploy needs the build step before restart, or PM2 serves stale assets. -->

- 2026-06-17 (tech-lead / bug-pipeline): **fingerprint the failure set before theorizing.** When many records/users are affected, one read-only tally (platform, entry path, user, version) often shows a uniform fingerprint that confirms or kills the reporter's hypothesis outright. The fingerprint is evidence; let it reframe the plan before you write a line.
- 2026-06-17 (tech-lead / log-admin): **for third-party "lost content" bugs, read the provider's live API and the FULL status-change chain**, not the terminal event — a terminal `done` carries no reason; the real one sits an event earlier. Run the call where the secret lives and print only booleans/enums back, so the key never hits the transcript.
- 2026-06-28 (qa-tester / all roles): **Playwright MCP is the default QA engine.** It acts on the accessibility tree (stable refs, a few hundred tokens per snapshot, no vision guessing) and drives Chromium/Firefox/WebKit. Leave `--browser` off for bundled Chromium (`chromium` is not a valid value). Keep each flow ≤ ~15 interactions; use a persistent gitignored profile for auth. Real logged-in browser = fallback only.
- 2026-07-27 (all roles): **an agent prompt can teach the bug it exists to prevent.** A copied "canonical pattern" in a role file went stale and was reproduced across tickets. Rules live in ONE canonical file (`rulesFile`); everything else points to it. A pointer can't go stale, a copy can.
- 2026-07-13 (tech-lead): **batch a sweep's fixes by area — never one PR per bug.** A one-PR-per-bug burn-down can exhaust CI minutes for the whole org.
- 2026-07-27 (claude-context-expert): **installed plugins run from a cache copy.** Editing the plugin's source folder doesn't change the loaded copy — reinstall/update the plugin, then restart.

