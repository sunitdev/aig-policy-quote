# Knowledge Base Rules

Before risk engine or knowledge base changes, read and follow `docs/kb.md`.

Agent guardrails:

- Keep business thresholds, points, factor descriptions, premium settings, and supported input values in the KB, not hardcoded in application code.
- If a new rule uses an existing input field and supported operator, change only the KB data.
- If a new rule needs a new input, add it to `uiInputs` and reference that input from the factor.
- Add a new operator only when both backend validation and the risk engine support it.
- Represent compound conditions as KB data with `all` or `or`, not custom branching in the risk engine.
- Update `kbSchemaVersion` only when the KB schema changes.
