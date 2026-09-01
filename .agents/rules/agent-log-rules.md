# Agent Log Rules

Follow these rules when agent logging is enabled for the repository.

- This rule applies to every user prompt in every chat window, including ordinary implementation tasks that do not mention logging.
- At the start of each user prompt, before making other changes, record that exact prompt in `AGENT_LOG.md` by piping the prompt text to `scripts/log-agent-prompt.sh` with the current agent name, for example `printf '%s' '<exact prompt>' | /bin/sh scripts/log-agent-prompt.sh codex`.
- If prompt logging fails, stop before making project changes and tell the user the log could not be updated.
- Use the same prompt-logging rule for planning feedback and post-plan/post-suggestion change requests; if the user gives a reason, keep it in the prompt text exactly as written.
- At the end of a response that contains a suggestion, plan, or completed-work summary, include one hidden Markdown comment on its own line: `<!-- agent-log-summary: one concise sentence summarizing your suggestion or outcome -->`.
- When the user asks for a change to your suggestion or plan and gives a reason, include one hidden Markdown comment on its own line: `<!-- agent-log-change-reason: concise reason from the user -->`.
- Keep these comments out of visible prose and do not mention them unless the user asks about the logging mechanism.
