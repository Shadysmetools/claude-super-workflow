---
description: Write the token-baton — a structured handoff so a fresh session resumes the super-workflow with zero loss. Run near ~256k tokens or before ending a long session.
allowed-tools: Read, Write, Edit, Bash, Skill
---

# /super-workflow:handoff

Write a clean baton so the next session continues exactly where this one stopped.

1. **Gather state** from `TEAM-BOARD.md`, recent decisions, and open work.
2. **Write `HANDOFF.md`** in the working dir with these sections:
   - **Goal** — the one-line objective in flight.
   - **Done** — what shipped this session (PRs, commits, deploys, with numbers/URLs).
   - **In flight** — current step + which role owns it.
   - **Decisions** — durable calls made (and by whom), so they aren't re-litigated.
   - **Blockers** — what's stuck and what unblocks it (incl. anything needing the
     human: dashboard clicks, secrets, approvals).
   - **Parked / needs human** — decisions the loop is NOT allowed to make on its own
     (production merges, anything in `humanGates` from `.superworkflow.json`,
     destructive/outward-facing ops, gate blocks), each with exactly what unblocks it.
     Empty is fine; the loop skips these and keeps shipping autonomous slices around them.
   - **Next 3 steps** — the immediate continuation, ordered. Each should be a bounded,
     independently-shippable slice (one loop firing).
   - **Loop state** — only when driven by `/super-workflow:loop`: `iteration: N`;
     `mission_complete: yes|no`; `next_action:` the exact slice the next firing takes;
     `suggested_wake:` fallback delay + what it's waiting on (a Monitor/CI, or an idle tick).
   - **Pointers** — branch name(s), `TEAM-BOARD.md`, relevant file paths, ticket IDs.

   If an unfinished `HANDOFF.md` for a *different* mission already exists, archive it to
   `HANDOFF-<slug>.md` before writing — never clobber another mission's baton.
3. **Persist to memory** — if a cross-session memory plugin is installed (e.g.
   claude-mem), capture the same baton as an observation titled `super-workflow-baton`,
   and, if the project-coordinator is active, add a note on the ticket in your tracker,
   so it survives even if `HANDOFF.md` is lost.
4. **Tell the user**: "Baton written to HANDOFF.md — start a fresh session and run
   `/super-workflow` to resume (or `/super-workflow:loop` to keep driving it hands-off)."
   Keep this confirmation in caveman if they asked for an update. If this handoff is a loop
   firing, don't stop here — hand back to `/super-workflow:loop` step 5 to decide
   continue/stop and schedule the next wake.

Keep the baton tight — it is read at token-zero next session, so every line must earn
its place. `HANDOFF.md` is runtime state: keep it out of git (it is in `.gitignore`).
