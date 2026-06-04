---
description: Refresh the competitive landscape — browse the tracked competitors and rewrite context/CURRENT-SAAS.md so every future session boots with current findings.
argument-hint: "(optional: a competitor name or URL to add/focus)"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Skill, WebFetch, WebSearch
---
# /super-workflow:saas-refresh

As tech-lead (with the designer role), refresh the competitive-SaaS snapshot so every future session starts with a current view of the landscape. Optional focus: $ARGUMENTS.

## Steps

1. **Read the current snapshot.** Open `context/CURRENT-SAAS.md` for the list of tracked competitors. If $ARGUMENTS names a new competitor or URL, add it to the tracked list.
2. **Browse each competitor live.** Use a headless or real browser to visit each tracked product. Capture: current positioning/tagline, pricing tiers, the headline features, any new launches since the last snapshot, and notable UX patterns worth borrowing or beating.
3. **Diff against the prior snapshot.** Note what changed since last refresh — new features, pricing moves, repositioning, anything that affects our roadmap or messaging.
4. **Rewrite `context/CURRENT-SAAS.md`.** Replace the body with the current findings. Structure it per competitor (positioning, pricing, key features, recent changes) plus a short "What changed since last refresh" section and the refresh date at the top. Use the native Write/Edit tools.
5. **Record the refresh.** Note the refresh in `TEAM-BOARD.md` (and cross-session memory if available) so the next session knows the snapshot is fresh and when it was taken.

Keep entries factual and dated. The goal is that any future session can read `context/CURRENT-SAAS.md` and immediately know the competitive landscape without re-browsing.
