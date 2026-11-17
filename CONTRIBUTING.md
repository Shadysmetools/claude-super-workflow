# Contributing

Thanks for helping make the team better. PRs are welcome: new roles, new pipelines, better recall wiring, non-Windows voice launchers, docs.

## Ground rules

- **Stay project-agnostic.** No company names, people, hostnames, IPs, emails, internal ticket numbers or private URLs in prompts, examples or docs. Project specifics belong in a user's `.superworkflow.json`, not in this repo.
- **Pointers, not copies.** If a rule already lives in one place (a pipeline skill, the tech-lead contract), point to it rather than restating it. Copies drift.
- **Keep the human gates.** Changes must not let the team merge to production, act on `humanGates` items, or do destructive/outward-facing actions without a human.
- **Small, focused PRs.** One concern per PR; explain the *why*.

## Repo map

| Path | What lives there |
|---|---|
| `agents/*.md` | Role definitions (frontmatter: `name`, `description`, `model`, `tools`, optional `skills`). |
| `skills/*/SKILL.md` | Pipelines and reference skills. Keep bodies under ~500 lines; push depth into `references/`. |
| `commands/*.md` | Slash commands (`/super-workflow`, `:loop`, `:handoff`, `:saas-refresh`). |
| `hooks/` | `hooks.json` + Node hook scripts. They must never throw and must always print valid JSON. |
| `scripts/` | Status line and voice dictation. |
| `context/` | Session-boot templates. |

## Before you open a PR

```bash
# manifests, skills, agents and commands parse
claude plugin validate .

# every script is syntactically valid
for f in hooks/*.cjs scripts/*.cjs; do node --check "$f"; done

# hooks still emit valid JSON
echo '{"cwd":"."}' | node hooks/session-start.cjs | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))'
echo '{"prompt":"update me"}' | node hooks/prompt-hook.cjs | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))'
```

Then test locally: `claude plugin marketplace add ./` from your clone, install, restart Claude Code, and run `/super-workflow` in a scratch repo.

## Commit style

Conventional-ish prefixes help: `feat(agent): …`, `fix(hook): …`, `docs: …`. Bump the version in **both** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` for releases.

## Reporting bugs and ideas

Use the issue templates. For security problems, see [SECURITY.md](SECURITY.md).
