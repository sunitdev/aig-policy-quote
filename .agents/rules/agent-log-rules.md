# Agent Log Rules

Follow these rules when agent logging is enabled for the repository.

- Before implementing an approved plan, paste the very first prompt from the current chat session into `AGENT_LOG.md`.
- Do not use scripts, hooks, or hidden Markdown comments for agent logging.
- Keep the initial prompt exact, preserving the user's spelling, formatting, links, and code blocks.
- Use `.agents/skills/agent-log-session/SKILL.md` when asked to update the current chat session entry with summary, changed files, or user suggestions.
