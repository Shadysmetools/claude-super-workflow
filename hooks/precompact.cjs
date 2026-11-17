#!/usr/bin/env node
/**
 * PreCompact hook for super-workflow.
 * Fires right before context compaction — the natural moment to preserve a baton.
 * Best-effort reminder so work isn't lost across the compaction boundary.
 */
const fs = require("fs");
try {
  // drain stdin (payload unused but must be consumed)
  try { fs.readFileSync(0, "utf8"); } catch {}
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreCompact",
        additionalContext:
          "[super-workflow] Compaction imminent. Tech-lead: ensure the latest decisions, " +
          "open work, and next steps are on TEAM-BOARD.md (and cross-session memory, if installed); consider " +
          "/super-workflow:handoff so nothing is lost.",
      },
    })
  );
} catch {
  process.stdout.write("{}");
}
