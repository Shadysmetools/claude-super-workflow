#!/usr/bin/env node
/**
 * PreCompact hook — fires right before the conversation is compacted.
 * Reminds the tech-lead to persist state so nothing is lost across the compaction.
 *
 * Always emits valid JSON on stdout.
 */
'use strict';

function emit(additionalContext) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: 'PreCompact',
      additionalContext: additionalContext || '',
    },
  };
  process.stdout.write(JSON.stringify(payload));
}

try {
  const msg = [
    'PRE-COMPACT: the conversation is about to be compacted.',
    'Tech-lead — before context is squeezed:',
    '- Ensure the latest decisions, open work, and next steps are written to TEAM-BOARD.md.',
    '- Consider running `/super-workflow:handoff` to capture the token-baton so nothing is lost.',
  ].join('\n');
  emit(msg);
} catch (_) {
  emit('');
}
