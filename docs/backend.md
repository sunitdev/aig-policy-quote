# Backend Design

## Overview

The backend is the authoritative policy quote service. It validates requests, exposes KB-backed UI metadata, evaluates risk rules, calculates premiums, and returns explainable quote responses.

The backend package is `@policy-quote/backend` under `apps/backend`. It exposes three Lambda handlers for the API Gateway path and one Fastify server for the Docker/Fargate path. Both adapters delegate to shared endpoint functions and services.

## Package Organization

```text
apps/backend/
  package.json
  tsconfig.json
  tsconfig.spec.json
  Dockerfile                         # Fastify container build for Docker/Fargate

  src/
    lambda/
      health.ts                      # exports handler for GET /health
      quote-ui-inputs.ts             # exports handler for GET /policy/quote/ui-inputs
      create-quote.ts                # exports handler for POST /policy/quote

    server/
      server.ts                      # Fastify process for local Docker/Fargate
      routes.ts                      # Fastify route registration

    endpoints/
      health.endpoint.ts             # shared endpoint for service health
      quote-ui-inputs.endpoint.ts    # shared endpoint for KB-backed form metadata
      create-quote.endpoint.ts       # shared endpoint for quote creation

    api/
      http-response.ts               # Lambda JSON response helpers
      http-error.ts                  # API error helpers/types

    health/
      health.service.ts              # service status and active KB version

    policy-quote/
      quote.service.ts               # quote orchestration use case
      quote.mapper.ts                # maps internal quote result to API response

    knowledge-base/
      load-kb.ts                     # loads kb/risk-kb.json
      kb.schema.ts                   # Zod schema for validating KB
      kb-runtime.ts                  # validates and compiles the active KB once
      kb.types.ts                    # KB-specific types

    risk-engine/
      compile-kb-factors.ts          # compiles KB condition rows into predicates
      condition-operators.ts         # generic condition operators
      evaluate-risk.ts               # calculates riskScore and appliedFactors
      premium.ts                     # calculates annual/monthly premium
      risk-band.ts                   # resolves risk band from KB thresholds
      risk-summary.ts                # builds plain-English risk summary
      risk-engine.types.ts           # risk engine internal types

    test/
      lambda-handlers.spec.ts
      fastify-routes.spec.ts
      quote.service.spec.ts
      risk-engine.spec.ts
      kb-validation.spec.ts
```

The backend is organized by responsibility:

- Runtime adapters handle transport concerns for Lambda and HTTP server execution.
- Shared endpoint functions keep public endpoint behavior reusable across Lambda and Fastify.
- API helpers keep response and error handling consistent.
- The health module reports service readiness and active KB version.
- The policy quote module coordinates quote creation.
- The knowledge base module loads, validates, and exposes `kb/risk-kb.json`.
- The risk engine module evaluates KB-defined conditions and calculates risk results.
- Tests cover behavior at the API, service, KB, and risk-engine levels.

## Public Endpoints

The backend exposes:

- `GET /policy/quote/ui-inputs`: returns quote form field definitions from `uiInputs` in `kb/risk-kb.json`.
- `POST /policy/quote`: calculates a policy quote.
- `GET /health`: returns service health and active KB version.

The quote response includes:

- `monthlyPremium`
- `annualPremium`
- `riskBand`
- `riskScore`
- `riskSummary`
- `coverageDetails`
- `appliedFactors`
- `kbVersion`

## Runtime Adapters

The backend supports two runtime paths that share the same endpoint functions and business services:

- Lambda path: three exported handlers adapt API Gateway events for `GET /health`, `GET /policy/quote/ui-inputs`, and `POST /policy/quote`.
- HTTP server path: one Fastify process runs as a long-lived service for local development, Docker, or Fargate.

Runtime adapters should remain thin. They translate transport-specific request and response details, then delegate to shared services. They should not own quote scoring, premium calculation, or KB business rules.

The Fastify server must not invoke Lambda handlers internally. Lambda and Fastify should call the same lower-level endpoint functions.

## Service Responsibilities

### UI Metadata Service

Single responsibility: expose quote form metadata from the KB.

Responsibilities:

- read validated `uiInputs`
- return field labels, types, descriptions, required flags, ranges, and select options
- keep frontend form rendering aligned with the KB

### Quote Service

Single responsibility: orchestrate the policy quote use case.

Responsibilities:

- receive validated quote input
- call the risk service
- call the premium service
- include applied factors and KB version
- shape the final quote result for the API layer

### Knowledge Base Service

Single responsibility: manage the active KB.

Responsibilities:

- load `kb/risk-kb.json`
- validate `kbSchemaVersion`, `uiInputs`, risk bands, premium settings, and factors
- expose active KB version
- expose UI input metadata
- provide validated rating and factor data to the risk and premium services

### Risk Service

Single responsibility: calculate risk from KB-defined factors.

Responsibilities:

- evaluate simple field conditions
- evaluate compound `condition.all` and `condition.or` groups
- apply matching factor points
- support per-occurrence scoring where configured
- return risk score, risk band, and applied factor details

### Premium Service

Single responsibility: calculate annual and monthly premiums.

Responsibilities:

- use `basePremium x riskMultiplier x coverageLoadFactor`
- take `riskMultiplier` from the resolved risk band
- round currency consistently
- return calculation details that can be displayed in quote results

### Health Service

Single responsibility: report backend status.

Responsibilities:

- return service availability
- return the active KB version
- avoid transport-specific logic

## API And Contract Boundary

The backend should use `@policy-quote/api-contract` for shared schemas and types:

- UI metadata response
- quote request
- quote response
- risk band identifiers
- applied factor shape

The backend remains authoritative for validation even when the frontend uses the same contracts for type safety and rendering.

## Knowledge Base Boundary

Insurance-specific scoring belongs in `kb/risk-kb.json`.

Backend code may define generic behavior such as loading, schema validation, condition evaluation, risk-band resolution, and premium calculation. It should not hardcode specific scoring rules like age thresholds, property-value thresholds, property-type points, or claims point values.

When a new rule uses an existing input field and operator, the change should be limited to the KB. Backend code changes are only needed for new generic capabilities, such as a new operator or a new validation rule.

## Testing Responsibilities

Backend tests should cover:

- public endpoint behavior
- UI metadata returned from `uiInputs`
- quote service orchestration
- KB schema validation
- simple and compound condition evaluation
- standard, elevated, and high-risk band resolution
- premium calculation with `basePremium`, `riskMultiplier`, and `coverageLoadFactor`
- applied factors coming from KB descriptions
- KB-only rule changes affecting scoring without engine changes

Tests should make it difficult for insurance-specific scoring logic to creep into TypeScript code.
