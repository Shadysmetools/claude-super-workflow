# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 1.2.x | ✅ |
| < 1.2 | ❌ (please upgrade) |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub's **[private vulnerability reporting](https://github.com/Shadysmetools/claude-super-workflow/security/advisories/new)** (Security tab → "Report a vulnerability"). Include:

- what is affected (a hook, the status line, an agent's tool scope, a command),
- steps to reproduce and the impact,
- any suggested fix.

You can expect an acknowledgement within a few days and a fix or mitigation plan after triage. Credit is given in the release notes unless you ask otherwise.

## Scope notes

This plugin runs **hooks and scripts on your machine with your permissions** (`hooks/*.cjs`, `scripts/statusline.cjs`, the optional voice script). They only read local files (your project's `.superworkflow.json` and the files it lists, `~/.claude/settings.json`, and `~/.claude.json` only when `SUPERWF_EXPECTED_ACCOUNT` is set) and never make network calls, except the voice script, which sends audio to the Groq API you configure.

Things that are **in scope**: a hook reading outside the project via `contextFiles`, secrets leaking into injected context or the status line, agent tool scopes broader than documented, or command prompts that bypass the human gates.
