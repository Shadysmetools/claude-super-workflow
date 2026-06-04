#!/usr/bin/env node
/**
 * SessionStart hook — boots every session with shared context.
 * Loads context/VISION.md, context/CURRENT-SAAS.md, context/SKILL-DELTAS.md
 * and injects them (token-zero) so every role shares the goal.
 *
 * Always emits valid JSON on stdout.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function pluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT && process.env.CLAUDE_PLUGIN_ROOT.trim()) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  return path.join(__dirname, '..');
}

function readIfPresent(absPath) {
  try {
    if (fs.existsSync(absPath)) {
      const content = fs.readFileSync(absPath, 'utf8');
      if (content && content.trim()) return content.trim();
    }
  } catch (_) {
    /* skip gracefully */
  }
  return null;
}

function emit(additionalContext) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: additionalContext || '',
    },
  };
  process.stdout.write(JSON.stringify(payload));
}

try {
  const root = pluginRoot();
  const ctxDir = path.join(root, 'context');

  const header = [
    '# super-workflow boot',
    '',
    'The tech-lead leads — it holds superior authority over this session.',
    'You (the user) are its assistant: bring intent and decisions; the tech-lead drives the plan.',
    'Agents communicate through the TEAM-BOARD blackboard plus the tech-lead message bus — read the board before acting.',
    'Say "update me" at any time to get a caveman-mode (ultra-terse) status.',
    '',
    'WARM RECALL before planning: refresh the knowledge graph, index + search relevant files (RAG), and search cross-session memory; cite what surfaced.',
  ].join('\n');

  const sections = [];

  const vision = readIfPresent(path.join(ctxDir, 'VISION.md'));
  if (vision) sections.push('<vision>\n' + vision + '\n</vision>');

  const saas = readIfPresent(path.join(ctxDir, 'CURRENT-SAAS.md'));
  if (saas) sections.push('<current-saas>\n' + saas + '\n</current-saas>');

  const deltas = readIfPresent(path.join(ctxDir, 'SKILL-DELTAS.md'));
  if (deltas) sections.push('<skill-deltas>\n' + deltas + '\n</skill-deltas>');

  const assembled = [header].concat(sections).join('\n\n');
  emit(assembled);
} catch (_) {
  emit('');
}
