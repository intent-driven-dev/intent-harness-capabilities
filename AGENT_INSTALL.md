# Agent Install Guide

Use this flow when installing one or more skills from this repository into a project. Skills are copied into the project's `.agents/skills/` directory; if the coding agent in use does not discover skills there, a symlink into its agent-specific skills folder is added on top.

## Step 1 — Clone This Repository

If `/tmp/intent-harness-capabilities` already exists, remove it first:

```bash
rm -rf /tmp/intent-harness-capabilities
git clone --depth 1 https://github.com/intent-driven-dev/intent-harness-capabilities.git /tmp/intent-harness-capabilities
```

## Step 2 — Select Skill(s)

**If the user already named the skill(s) they want**, check that each exists in the clone:

```bash
ls /tmp/intent-harness-capabilities/.agents/skills/<skill-name>
```

**If no skill was named**, list what is available and ask the user to pick one or more:

```bash
ls /tmp/intent-harness-capabilities/.agents/skills/
```

Multiple skills may be installed in one run. If a named skill does not exist in the clone, report it to the user and continue with the remaining skills.

## Step 3 — Copy into the Project

For each selected skill, copy the full directory recursively (skills may carry `templates/`, `references/`, and other supporting files alongside `SKILL.md`):

```bash
mkdir -p ./.agents/skills
cp -R /tmp/intent-harness-capabilities/.agents/skills/<skill-name> ./.agents/skills/<skill-name>
```

**If `./.agents/skills/<skill-name>` already exists** in the project, do not overwrite it silently — ask the user whether to replace it or keep their copy. Check this before running `cp -R`. If the user approves replacement, remove the existing destination skill directory before running `cp -R` to prevent nested copies or stale files.

## Step 4 — Symlink for the Agent (if needed)

Some agents discover skills in `.agents/skills/` directly — if the agent in use does, skip this step. Otherwise, link the skill into the agent's own skills folder:

| Agent | Skills folder |
| --- | --- |
| Claude Code | `.claude/skills/` |
| OpenCode | `.opencode/skills/` |
| Codex | `.codex/skills/` |

**The symlink target is ALWAYS the project-local copy made in Step 3 (`./.agents/skills/<skill-name>`), never the `/tmp` clone** — `/tmp/intent-harness-capabilities` is deleted and re-cloned on the next install. Use a relative link so it survives the repo being moved or cloned elsewhere:

```bash
mkdir -p ./.claude/skills
ln -s ../../.agents/skills/<skill-name> ./.claude/skills/<skill-name>
```

(For `.opencode/skills/` or `.codex/skills/` the relative target is the same: `../../.agents/skills/<skill-name>`.)

- Detect which agent folders exist in the project (`.claude/`, `.opencode/`, `.codex/`) and link into the ones in use; when unsure, ask the user which agent(s) they run.
- **If a symlink or directory already exists** at the link path, ask the user before replacing it.

Verify the link resolves into the project's own copy:

```bash
ls -la ./.claude/skills/<skill-name>
test -d ./.claude/skills/<skill-name>
```

Expected: `<skill-name> -> ../../.agents/skills/<skill-name>`.

## Step 5 — Report

Finish by listing what was installed, for example:

```text
Installed skills: glossary, adrs → ./.agents/skills/
Symlinked for Claude Code: ./.claude/skills/glossary, ./.claude/skills/adrs
```
