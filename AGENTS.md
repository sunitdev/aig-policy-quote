# Agent Instructions

This repository uses `.agents/` as the canonical source of truth for agent instructions.

Before making changes, read and follow `.agents/rules/project-rules.md`.

Always read and follow `.agents/rules/agent-log-rules.md` before starting work on a user prompt.

Load any additional rule files routed from `project-rules.md` for the area you are changing.

Before implementing an approved plan, paste the very first prompt from the current chat session into [AGENT_LOG.md](AGENT_LOG.md). Use `.agents/skills/agent-log-session/SKILL.md` when you want to update the rest of that session entry.
