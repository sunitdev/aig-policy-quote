# Solution

The app is a pnpm/Turborepo workspace with an Angular standalone frontend, a Node.js
backend, shared API contracts, and CDK infrastructure. The frontend renders a single
policy quote page from `GET /policy/quote/ui-inputs`, builds a Reactive Form from that
metadata, keeps page state in Angular Signals, and submits the raw form object to
`POST /policy/quote`. It displays only backend-returned premiums, risk data, coverage
details, and applied factors.

The backend keeps Lambda and Fastify/container runtimes thin. Both adapters call shared
endpoint and service functions, so validation, KB loading, risk evaluation, and premium
calculation stay in one deterministic core. The shared `@policy-quote/api-contract`
package holds the request and response schemas to avoid frontend/backend drift.

`kb/risk-kb.json` is the first-class rule source. Its schema separates form metadata
(`uiInputs`), rating settings (`basePremium`, `coverageLoadFactor`, `riskBands`), and
risk factors. Factors use generic operators (`eq`, `gt`, `gte`, `between`,
`outside_range`) plus `all`/`or` compound conditions, which lets rule weights,
thresholds, descriptions, and many new combinations change without scoring-code edits.
Zod validates both API contracts and KB shape.

Agent instructions are committed under `.agents/` so agents inherit the repo's
boundaries before changing code. `AGENT_LOG.md` records significant prompts and
decisions for review. The `risk-kb-factor` skill adds a backup-first KB workflow: edit
`kb/risk-kb.json.backup`, validate it with the backend parser, then promote only a valid
candidate. With more time, I would add versioned KB release files and return active KB
version metadata from quote responses.
