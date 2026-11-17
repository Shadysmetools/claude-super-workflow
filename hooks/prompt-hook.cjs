#!/usr/bin/env node
/**
 * UserPromptSubmit hook for super-workflow. Two jobs, both best-effort:
 *   1. If the prompt is "update me" (or similar) -> instruct caveman-mode reply.
 *   2. Token watch: if the transcript is large (proxy for ~256k tokens) -> warn the
 *      tech-lead to run /super-workflow:handoff and start a fresh session.
 * No native token-threshold hook exists, so transcript byte-size is the proxy.
 * Override the threshold with SUPERWF_HANDOFF_BYTES (default ~3MB).
 */
const fs = require("fs");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let injected = [];
try {
  const raw = readStdin();
  const data = raw ? JSON.parse(raw) : {};
  const prompt = (data.prompt || "").trim();

  // 1. "update me" -> caveman
  if (/^\s*update\s*me\b/i.test(prompt) || /^\s*status\s*update\s*$/i.test(prompt)) {
    injected.push(
      "[super-workflow] The user asked for an update. Tech-lead: reply in CAVEMAN " +
        "mode — ultra-terse status, drop articles/filler, keep full technical accuracy. " +
        "Cover: what shipped, what's in flight, what's blocked, next step."
    );
  }

  // 2. token watch (transcript size proxy)
  const threshold = parseInt(process.env.SUPERWF_HANDOFF_BYTES || "3000000", 10);
  const tpath = data.transcript_path;
  if (tpath) {
    try {
      const bytes = fs.statSync(tpath).size;
      if (bytes >= threshold) {
        injected.push(
          "[super-workflow] ⚠️ Context is large (~" +
            Math.round(bytes / 1e6) +
            "MB transcript, nearing the ~256k-token line). Tech-lead: wrap the current " +
            "step, run /super-workflow:handoff to write the baton, then continue in a fresh session."
        );
      }
    } catch {}
  }

  if (injected.length) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: injected.join("\n"),
        },
      })
    );
  } else {
    process.stdout.write("{}");
  }
} catch {
  process.stdout.write("{}");
}
