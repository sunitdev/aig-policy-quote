---
name: agent-log-session
description: Update AGENT_LOG.md for the current agent session using the project log template, without scripts, hooks, or tool-specific automation.
---

# Agent Log Session

Use this skill when the user asks to update `AGENT_LOG.md` for the current chat or agent session. This skill is intentionally tool-agnostic: any agent can follow it by editing Markdown directly.

## Purpose

Maintain a clear human-readable session record in `AGENT_LOG.md` without relying on scripts, hooks, hidden comments, generated state, or agent-specific metadata.

The log should answer four questions:

- What was the original user request?
- What work was completed?
- Which files changed?
- What corrections, suggestions, or direction changes did the user give during the session?

## Required Data

Collect these values from the active session or surrounding agent runtime:

- Session title: a concise human-readable title for the session.
- Started: the timestamp of the first user prompt in local time, including timezone offset.
- Agent: the agent/tool name, such as `codex`, `claude`, or `cursor`.
- Session ID: the stable session identifier when one is available; otherwise use `unknown`.
- Initial prompt: the first user-authored prompt in the session.
- Summary of change: completed outcomes from the session.
- Changed files: repository-relative paths touched by the session, including deleted files.
- User suggestions: corrections, requested direction changes, or explicit preferences the user gave after the initial prompt.

## Required Template

Every session entry must use this structure:

````markdown
## Session: <Title goes here>

- Started: <YYYY-MM-DD HH:MM:SS +/-HH:MM>
- Agent: <agent name>
- Session ID: `<session id>`

### Initial Prompt

**Prompted at:** <YYYY-MM-DD HH:MM:SS +/-HH:MM>

```text
<The first user prompt from this chat/session, copied exactly.>
```

### Summary of change

- <Concise bullet describing what this session did>

### What Changed

- `<repo-relative/path>`

### What Changes were suggest by the user

- <User suggestion, correction, or direction change>
````

## Update Rules

- Find the current session entry by `Session ID` when the ID is available.
- If the current session has no entry, append a new entry to the end of `AGENT_LOG.md`.
- Keep entries in chronological order by `Started` timestamp when practical.
- Use a short session title that describes the work, not the raw prompt unless the raw prompt is already concise.
- Preserve the initial prompt exactly as written, including spelling, whitespace, Markdown, links, and code blocks.
- If the initial prompt contains triple backticks, wrap it in a longer fence such as four backticks.
- Use repository-relative paths in `What Changed`.
- Include deleted files in `What Changed` when they are part of the session outcome.
- Record user-requested changes in `What Changes were suggest by the user`; write `- None` only when there were no suggestions, corrections, or direction changes.
- Preserve unrelated session entries. Do not rewrite old entries unless the user explicitly asks.
- Keep the existing heading text exactly as shown in the template, including `What Changes were suggest by the user`, so the log stays consistent with existing entries.

## Quality Bar

Before finishing, check that:

- The session has exactly one `Initial Prompt` section.
- The initial prompt is fenced and readable.
- The summary describes completed work, not intent.
- The changed-file list matches the actual files touched in the session.
- The user-suggestions list captures meaningful user direction without inventing rationale.
- No script, hook, hidden Markdown comment, or tool-specific state was added for logging.
