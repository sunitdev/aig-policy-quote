# Backend Rules

Before backend changes, read and follow `docs/backend.md`.

Agent guardrails:

- Keep Lambda and HTTP runtime adapters thin; transport code must delegate to shared services.
- Use `@policy-quote/api-contract` for shared request, response, risk band, and applied factor contracts.
- Keep insurance-specific scoring values out of TypeScript code; they belong in `kb/risk-kb.json`.
- Add or update tests around endpoints, services, KB validation, risk-engine behavior, premium calculation, and applied factors when those behaviors change.
