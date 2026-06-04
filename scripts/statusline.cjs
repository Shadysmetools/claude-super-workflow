#!/usr/bin/env node
/**
 * Claude Code statusLine command.
 * Reads status JSON from stdin and prints ONE line:
 *   ⚡ <model> ▸ <folder> | ~<k> tok (<pct>% of 256k) | $<cost>
 *
 * Defensive: missing fields degrade gracefully, never crashes.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (_) {
    return '';
  }
}

function pick() {
  for (let i = 0; i < arguments.length; i++) {
    const v = arguments[i];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

try {
  let data = {};
  try {
    data = JSON.parse(readStdin() || '{}') || {};
  } catch (_) {
    data = {};
  }

  // Model name
  const model =
    pick(
      data.model && data.model.display_name,
      typeof data.model === 'string' ? data.model : undefined,
      data.model && data.model.id
    ) || 'model';

  // Working dir -> basename
  const cwd = pick(
    data.workspace && data.workspace.current_dir,
    data.cwd,
    data.workspace && data.workspace.project_dir
  );
  let folder = 'project';
  if (cwd) {
    try {
      folder = path.basename(cwd) || folder;
    } catch (_) {
      /* keep default */
    }
  }

  // Cost
  let cost = pick(data.cost && data.cost.total_cost_usd, data.total_cost_usd);
  let costStr = '0.00';
  if (typeof cost === 'number' && isFinite(cost)) {
    costStr = cost.toFixed(2);
  }

  // Token estimate from transcript file size
  const threshold = Number(process.env.SUPERWF_HANDOFF_BYTES) || 3000000;
  const transcriptPath = pick(
    process.env.CLAUDE_TRANSCRIPT_PATH,
    data.transcript_path,
    data.transcriptPath,
    data.transcript
  );

  let kTok = 0;
  let pct = 0;
  if (transcriptPath) {
    try {
      const stat = fs.statSync(transcriptPath);
      if (stat && stat.size > 0) {
        const tokens = Math.round(stat.size / 12);
        kTok = Math.round(tokens / 1000);
        pct = Math.min(100, Math.round((stat.size / threshold) * 100));
      }
    } catch (_) {
      /* no transcript yet */
    }
  }

  const line =
    '⚡ ' +
    model +
    ' ▸ ' +
    folder +
    ' | ~' +
    kTok +
    'k tok (' +
    pct +
    '% of 256k) | $' +
    costStr;

  process.stdout.write(line);
} catch (_) {
  try {
    process.stdout.write('⚡ status');
  } catch (_) {
    /* give up silently */
  }
}
