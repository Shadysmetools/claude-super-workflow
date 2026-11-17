#!/usr/bin/env node
/**
 * SessionStart hook for super-workflow — PROJECT-AWARE.
 *
 * Boots every session with the team contract plus YOUR project's context, so the
 * same plugin adapts to whatever repo it opens in:
 *
 *   1. Looks for a `.superworkflow.json` from the session cwd upward
 *      (see `.superworkflow.example.json` in the plugin root).
 *   2. If found: injects a short project summary (branches, environments, review
 *      gates, human gates, rules file) and every file listed in `contextFiles`.
 *   3. Always: injects the plugin's own context/VISION.md, CURRENT-SAAS.md and
 *      SKILL-DELTAS.md when they hold real content (templates are skipped).
 *   4. Without a config: "generic mode" — the team reads the repo's own
 *      CLAUDE.md / README to learn its conventions and asks before assuming any.
 *
 * Best-effort: never throws, never blocks a session, always emits valid JSON.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// --- tiny fs helpers -------------------------------------------------------
function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8").trim();
  } catch {
    return "";
  }
}
function pluginRoot() {
  const env = process.env.CLAUDE_PLUGIN_ROOT;
  return env && env.trim() ? env : path.join(__dirname, "..");
}
function readCtx(rel) {
  const body = readFileSafe(path.join(pluginRoot(), "context", rel));
  // Skip untouched templates so they don't burn tokens every session.
  if (!body || /<!--\s*superworkflow:template\s*-->/.test(body)) return "";
  return body;
}
// Walk from `start` up to the filesystem root; return the first existing path.
function findUp(start, name) {
  try {
    let dir = start;
    for (let i = 0; i < 40 && dir; i++) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {}
  return "";
}

// --- read the session payload (SessionStart provides cwd on stdin) ---------
let cwd = process.cwd();
try {
  const raw = fs.readFileSync(0, "utf8");
  if (raw) {
    const data = JSON.parse(raw);
    if (data && typeof data.cwd === "string" && data.cwd) cwd = data.cwd;
  }
} catch {}

// --- load the project config ----------------------------------------------
function loadConfig(start) {
  const cfgPath = findUp(start, ".superworkflow.json");
  if (!cfgPath) return { cfg: null, cfgDir: "" };
  try {
    return { cfg: JSON.parse(readFileSafe(cfgPath)) || {}, cfgDir: path.dirname(cfgPath) };
  } catch {
    return { cfg: null, cfgDir: "", error: cfgPath };
  }
}
const { cfg, cfgDir, error: cfgError } = loadConfig(cwd);

// --- shared lines (project-independent) ------------------------------------
const TEAM =
  "The tech-lead agent leads (superior authority). The user is its assistant. " +
  "Agents communicate via the TEAM-BOARD blackboard + the tech-lead message bus. " +
  'Say "update me" anytime → tech-lead replies in caveman mode.';
const RECALL =
  "WARM RECALL before planning any non-trivial task: refresh the knowledge graph if one " +
  "is installed (e.g. /graphify --update), index + search the relevant files (RAG), and " +
  "search cross-session memory. Cite what recall surfaced in the plan.";
const RESUME =
  "RESUME FIRST: if a HANDOFF.md baton exists in the working dir and its mission is " +
  "unfinished, continue it instead of starting over.";

function languageLine(c) {
  const lang = c && typeof c.replyLanguage === "string" && c.replyLanguage.trim();
  return lang
    ? "LANGUAGE: always reply to the user in " + lang + ", whatever language they write in."
    : "";
}

function projectSummary(c) {
  if (!c) return "";
  const b = c.branches || {};
  const e = c.environments || {};
  const g = c.gates || {};
  const lines = ["PROJECT CONFIG (.superworkflow.json):"];
  if (b.production) lines.push("- Production branch: " + b.production + " (bugs target it; a human merges)");
  if (b.staging) lines.push("- Staging branch: " + b.staging + " (features land here first; promote by cherry-pick)");
  if (e.staging) lines.push("- Staging URL: " + e.staging);
  if (e.production) lines.push("- Production URL: " + e.production);
  const gates = Object.entries(g).filter(([, v]) => v).map(([k, v]) => k + "=" + v);
  if (gates.length) lines.push("- Review gates: " + gates.join(", "));
  if (Array.isArray(c.humanGates) && c.humanGates.length)
    lines.push("- Human gates (always stop and ask): " + c.humanGates.join("; "));
  if (c.approver) lines.push("- Final approver: " + c.approver);
  if (c.tracker) lines.push("- Ticket tracker: " + c.tracker);
  if (c.rulesFile)
    lines.push(
      "- Canonical rules: " + c.rulesFile +
        " — read it before stating any branch target or gate; never restate it from memory."
    );
  return lines.length > 1 ? lines.join("\n") : "";
}

function dependencyNote() {
  try {
    const settings = JSON.parse(
      fs.readFileSync(path.join(os.homedir(), ".claude", "settings.json"), "utf8")
    );
    const enabled = new Set(
      Object.entries(settings.enabledPlugins || {})
        .filter(([, v]) => v)
        // Match on the plugin NAME (before "@"): the same plugin can come from
        // different marketplaces, and a false "missing" warning is worse than none.
        .map(([k]) => String(k).split("@")[0])
    );
    const missing = ["context-mode", "claude-mem"].filter((n) => !enabled.has(n));
    if (missing.length) {
      return (
        "(optional) recall plugins not enabled: " + missing.join(", ") +
        " — the team still works; recall is just shallower."
      );
    }
  } catch {}
  return "";
}

// --- assemble the boot block ----------------------------------------------
const name = cfg && typeof cfg.name === "string" && cfg.name.trim();
const parts = [
  "# ⚡ Super Workflow — session boot" + (name ? " (project: " + name + ")" : cfg ? "" : " (generic mode)"),
  TEAM,
  languageLine(cfg),
  RECALL,
  RESUME,
  "",
];

if (cfg) {
  parts.push(projectSummary(cfg));
} else {
  parts.push(
    "GENERIC MODE: no .superworkflow.json found. The full role team is available, but do " +
      "NOT assume branch names, deploy targets or review tools. Read this repo's CLAUDE.md / " +
      "README first, ask before implementing, and suggest the user copy " +
      ".superworkflow.example.json from the plugin into the project root." +
      (cfgError ? " (A .superworkflow.json exists at " + cfgError + " but is not valid JSON.)" : "")
  );
}

const vision = readCtx("VISION.md");
const saas = readCtx("CURRENT-SAAS.md");
const deltas = readCtx("SKILL-DELTAS.md");
if (vision) parts.push("<vision>\n" + vision + "\n</vision>");
if (saas) parts.push("<current-saas>\n" + saas + "\n</current-saas>");
if (deltas) parts.push("<skill-deltas>\n" + deltas + "\n</skill-deltas>");

// Custom contextFiles from `.superworkflow.json`, resolved relative to it.
if (cfg && Array.isArray(cfg.contextFiles) && cfgDir) {
  for (const rel of cfg.contextFiles) {
    if (typeof rel !== "string") continue;
    const abs = path.resolve(cfgDir, rel);
    const inside = path.relative(path.resolve(cfgDir), abs);
    if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) continue; // stay inside the project
    const body = readFileSafe(abs);
    if (body) parts.push('<project-context src="' + rel + '">\n' + body + "\n</project-context>");
  }
}

const note = dependencyNote();
if (note) parts.push(note);

try {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: parts.filter(Boolean).join("\n"),
      },
    })
  );
} catch {
  process.stdout.write("{}");
}
