# Project Rules

Use these global rules before changing the project.

- Always read and follow `.agents/rules/agent-log-rules.md` before starting work on any user prompt.
- Always use Jest for project tests.
- For architecture work, cross-cutting design changes, package boundaries, deployment shape, or end-to-end quote flow changes, read and follow `docs/architecture.md`.
- For frontend work in `apps/frontend`, or changes to frontend UI, forms, state, styling, or API-client behavior, read and follow `.agents/rules/frontend-rules.md`.
- For backend work in `apps/backend`, or changes to API, service, validation, runtime adapter, health, or quote behavior, read and follow `.agents/rules/backend-rules.md`.
- For risk engine or knowledge base work involving `kb/risk-kb.json`, KB validation, factors, operators, scoring, risk bands, or premium inputs, read and follow `.agents/rules/kb-rules.md`.
- If a change spans more than one area, read every matching rule file before editing.

The detailed implementation guidance belongs in `docs/`; keep this rule layer concise and pointer-based.
