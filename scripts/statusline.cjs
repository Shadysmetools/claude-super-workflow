#!/usr/bin/env node
/**
 * super-workflow status line:
 *   [account ▸] model ▸ folder | ctx:[bar]% | 256k:[bar] | 5h:[bar]% | 7d:[bar]% | $cost | duration
 *
 * Uses the REAL fields Claude Code feeds the status line on stdin:
 *   context_window.used_percentage, rate_limits.five_hour/seven_day.used_percentage,
 *   cost.total_cost_usd, cost.total_duration_ms. Missing fields are simply skipped.
 * Pure Node — no jq or other dependency.
 *
 * Account segment is OPT-IN: set SUPERWF_EXPECTED_ACCOUNT to the email you expect
 * to be logged in with, and the line shows a green 👤 when it matches and a red
 * ⚠ WRONG ACCOUNT when it doesn't (read from oauthAccount in ~/.claude.json).
 * Unset (the default), no account or email is ever shown — safe for screenshots.
 *
 * Handoff warning: transcript byte-size vs SUPERWF_HANDOFF_BYTES (≈256k tokens),
 * same ratio as the prompt hook, so the ⚠ here fires when that does.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
let d = {};
try { d = JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch {}

// ---- account + alert (opt-in) ----
const EXPECTED = (process.env.SUPERWF_EXPECTED_ACCOUNT || "").trim().toLowerCase();
let acct = "";
if (EXPECTED) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".claude.json"), "utf8"));
    const oa = cfg.oauthAccount || {};
    const email = oa.emailAddress || "";
    let plan = (oa.organizationRateLimitTier || oa.organizationType || "")
      .replace(/^default_/, "").replace(/^claude_/, "").replace(/_/g, " ");
    plan = plan ? plan.replace(/\b\w/g, c => c.toUpperCase()) : "?";
    if (!email) {
      acct = "\x1b[31m⚠ NOT LOGGED IN\x1b[0m ▸ ";
    } else if (email.toLowerCase() !== EXPECTED) {
      acct = `\x1b[1;31m⚠ WRONG ACCOUNT: ${email} (${plan})\x1b[0m ▸ `;
    } else {
      acct = `\x1b[32m👤 ${email}\x1b[0m (${plan}) ▸ `;
    }
  } catch { acct = "\x1b[31m⚠ account unknown\x1b[0m ▸ "; }
}

// ---- model + folder (colored) ----
const model = (d.model && (d.model.display_name || d.model.id)) || "claude";
const dir = (d.workspace && (d.workspace.current_dir || d.workspace.project_dir)) || "";
const folder = dir.split(/[\\/]/).filter(Boolean).pop() || "~";
const MODEL = `\x1b[1;95m${model}\x1b[0m`;          // bright magenta
const FOLDER = `\x1b[1;94m${folder}\x1b[0m`;        // bright blue
const SEP = " \x1b[90m|\x1b[0m";                     // dim separator
const ARROW = " \x1b[90m▸\x1b[0m ";

// ---- bars (colorful gauge: █ cells gradient green→yellow→red, dim track) ----
function bar(pct, w = 10) {
  const filled = Math.min(w, Math.floor((pct * w) / 100));
  let out = "";
  for (let i = 0; i < filled; i++) {
    const cell = ((i + 1) / w) * 100;            // gradient by position
    out += (cell > 80 ? "\x1b[91m" : cell > 50 ? "\x1b[93m" : "\x1b[92m") + "█";
  }
  if (w - filled > 0) out += "\x1b[90m" + "░".repeat(w - filled);
  return out + "\x1b[0m";
}
function pctColor(pct) {
  if (pct >= 80) return "\x1b[1;91m"; // bright red
  if (pct >= 60) return "\x1b[1;93m"; // bright yellow
  return "\x1b[1;92m";                // bright green
}
function gauge(label, pct) {
  const p = Math.round(pct);
  return `${SEP} \x1b[36m${label}\x1b[0m:${bar(p)} ${pctColor(p)}${p}%\x1b[0m`;
}

// ---- context window: real field + the 256k handoff budget (always shown) ----
let ctx = "";
const cw = d.context_window || {};
if (typeof cw.used_percentage === "number") {
  ctx = gauge("ctx", cw.used_percentage);
}
// 256k baton budget from transcript bytes (matches the auto-handoff hook ratio)
const tp = d.transcript_path;
const HANDOFF_BYTES = parseInt(process.env.SUPERWF_HANDOFF_BYTES || "3000000", 10);
if (tp) {
  try {
    const bytes = fs.statSync(tp).size;
    const estPct = Math.min(100, Math.round((bytes / HANDOFF_BYTES) * 100));
    const approxK = Math.round(bytes / 12 / 1000); // ~12 bytes/token in JSON transcript
    ctx += `${SEP} \x1b[36m256k\x1b[0m:${bar(estPct)} ${pctColor(estPct)}~${approxK}k/${estPct}%\x1b[0m`;
    if (estPct >= 90) ctx += " \x1b[1;91m⚠ run /super-workflow:handoff\x1b[0m";
  } catch {}
}

// ---- plan rate limits (the /usage bars): 5-hour + 7-day ----
let usage = "";
const rl = d.rate_limits || {};
if (rl.five_hour && typeof rl.five_hour.used_percentage === "number") {
  usage += gauge("5h", rl.five_hour.used_percentage);
}
if (rl.seven_day && typeof rl.seven_day.used_percentage === "number") {
  usage += gauge("7d", rl.seven_day.used_percentage);
}

// ---- cost + duration (gold / dim) ----
let cost = "";
if (d.cost && typeof d.cost.total_cost_usd === "number") {
  cost = `${SEP} \x1b[1;33m$${d.cost.total_cost_usd.toFixed(2)}\x1b[0m`;
}
let dur = "";
if (d.cost && typeof d.cost.total_duration_ms === "number") {
  const s = Math.floor(d.cost.total_duration_ms / 1000);
  dur = `${SEP} \x1b[90m${Math.floor(s / 60)}m${s % 60}s\x1b[0m`;
}

process.stdout.write(`\x1b[93m⚡\x1b[0m ${acct}${MODEL}${ARROW}${FOLDER}${ctx}${usage}${cost}${dur}`);
