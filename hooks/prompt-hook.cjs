#!/usr/bin/env node
/**
 * UserPromptSubmit hook.
 *  - "update me" (exact or prefix) -> instruct tech-lead to reply in caveman mode.
 *  - token-watch: if the transcript file is >= SUPERWF_HANDOFF_BYTES, recommend handoff.
 *
 * Always emits valid JSON on stdout.
 */
'use strict';

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (_) {
    return '';
  }
}

function emit(additionalContext) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: additionalContext || '',
    },
  };
  process.stdout.write(JSON.stringify(payload));
}

try {
  const raw = readStdin();
  let prompt = '';
  try {
    const parsed = JSON.parse(raw || '{}');
    prompt = typeof parsed.prompt === 'string' ? parsed.prompt : '';
  } catch (_) {
    prompt = '';
  }

  const norm = prompt.toLowerCase().trim();
  const parts = [];

  if (norm === 'update me' || norm.startsWith('update me')) {
    parts.push(
      'The user asked for a status update. Reply in CAVEMAN MODE: ultra-terse, drop ' +
        'articles/filler/pleasantries, keep full technical accuracy. Short status only.'
    );
  }

  // token-watch
  const threshold = Number(process.env.SUPERWF_HANDOFF_BYTES) || 3000000;
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;
  if (transcriptPath) {
    try {
      const stat = fs.statSync(transcriptPath);
      if (stat && stat.size >= threshold) {
        parts.push(
          'TOKEN-WATCH: transcript is ' +
            stat.size +
            ' bytes (threshold ' +
            threshold +
            '). Context is getting large — recommend running `/super-workflow:handoff` ' +
            'to write the token-baton before anything is lost.'
        );
      }
    } catch (_) {
      /* transcript not readable yet — ignore */
    }
  }

  emit(parts.join('\n\n'));
} catch (_) {
  emit('');
}
