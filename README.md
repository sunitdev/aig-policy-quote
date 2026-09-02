# Policy Quote

Policy Quote is a minimal home insurance quote application. The Angular frontend renders
quote fields from backend-provided knowledge base metadata, submits the completed form,
and displays the premium, risk band, risk score, risk summary, coverage details, and
applied risk factors returned by the backend.

The backend is the authority for validation, risk scoring, premium calculation, and quote
responses. Risk rules live in `kb/risk-kb.json`, so supported rule changes can be made as
KB data instead of TypeScript scoring code.

## Repo Structure

```text
.
+-- apps/
|   +-- backend/          # Lambda handlers, shared endpoints/services, Fastify server
|   +-- frontend/         # Angular standalone frontend
+-- packages/
|   +-- api-contract/     # Shared Zod schemas and TypeScript API types
|   +-- infra/            # CDK app for API Gateway and Lambda wiring
+-- kb/
|   +-- risk-kb.json      # Active policy quote knowledge base
+-- docs/                 # Architecture, backend, frontend, infra, and KB notes
+-- .agents/              # Agent rules and project skills
+-- Makefile              # Common local commands
+-- AGENT_LOG.md          # Significant agent interaction log
```

## Prerequisites

- Node.js 22
- pnpm 11.25.0
- AWS SAM CLI, for the local serverless API workflow
- Docker, for the container-style backend workflow

## Install

```sh
make install
```

Equivalent pnpm command:

```sh
pnpm install
```

## Run Locally

Run the frontend with the serverless/SAM backend:

```sh
make dev-serverless
```

Run the frontend with the Fastify backend:

```sh
make dev-fastify
```

Run only the Angular frontend:

```sh
make frontend-up
```

The frontend serves on `http://127.0.0.1:4200` and calls the API at
`http://127.0.0.1:3000` by default.

Run only the serverless backend API:

```sh
make dev-serverless-api
```

Run only the Fastify backend API:

```sh
make dev-fastify-api
```

The backend exposes:

- `GET /health`
- `GET /policy/quote/ui-inputs`
- `POST /policy/quote`

## Serverless API With SAM

The SAM workflow uses the CloudFormation template produced by CDK synth.

```sh
make serverless-api-up
```

Under the hood this runs:

```sh
pnpm --filter @policy-quote/infra --fail-if-no-match synth
sam local start-api -t packages/infra/cdk.out/PolicyQuoteInfraStack.template.json --port 3000
```

## Fastify And Container Backend

Run the Fastify backend directly in development:

```sh
pnpm --filter @policy-quote/backend dev
```

Build the container image:

```sh
make backend-container-build
```

Run the containerized backend on port `3000`:

```sh
make backend-container-up
```

The Dockerfile builds the backend and shared contract package, copies
`kb/risk-kb.json`, sets `RISK_KB_PATH=kb/risk-kb.json`, and starts the compiled Fastify
server.

## Checks

Run all Jest tests:

```sh
make test
```

Run lint:

```sh
make lint
```

Run TypeScript type checks:

```sh
make typecheck
```

Build all workspace packages:

```sh
make build
```

Check formatting:

```sh
make format-check
```

Equivalent pnpm scripts are also available:

```sh
pnpm run test
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run format:check
```

## Knowledge Base And Rule Changes

The active KB is `kb/risk-kb.json`. It contains:

- `kbSchemaVersion` and business `version`
- `basePremium` and `coverageLoadFactor`
- `riskBands` with score ranges and premium multipliers
- `uiInputs` used by the backend and frontend form
- `factors` used by the risk engine

Current quote inputs are `customerName`, `age`, `previousClaims`, `propertyType`, and
`propertyValue`.

Risk factors are table-driven. A factor defines an `id`, description, condition, points,
and optional `perOccurrence` behavior. The implemented condition operators are `eq`,
`gt`, `gte`, `between`, and `outside_range`; compound conditions use `all` and `or`.

For supported rule changes, edit a backup candidate first:

```sh
cp kb/risk-kb.json kb/risk-kb.json.backup
```

Validate the backup without promotion:

```sh
pnpm kb:check-risk-kb-backup
```

Promote a valid backup into the active KB:

```sh
pnpm kb:promote-risk-kb-backup
```

Use `.agents/skills/risk-kb-factor/SKILL.md` for the repository's backup-first agent
workflow when adding or updating risk factors.
