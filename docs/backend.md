# Backend Design

## Overview

The backend is the authoritative policy quote service. It validates requests, exposes KB-backed UI metadata, evaluates risk rules, calculates premiums, and returns explainable quote responses.

The backend package is `@policy-quote/backend` under `apps/backend`. This document intentionally stays at module and service level so the implementation can evolve without requiring the docs to list every source file.

## Package Organization

```text
apps/backend/
  package and runtime config
  deployment config
  source code
    runtime adapters
    API helpers
    health module
    policy quote module
    knowledge base module
    risk engine module
    tests
```

The backend is organized by responsibility:

- Runtime adapters handle transport concerns for Lambda and HTTP server execution.
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

The backend supports two runtime paths that share the same business services:

- Lambda path: adapts API Gateway events into route execution and uses middleware for Lambda-specific concerns.
- HTTP server path: runs as a long-lived service for local development or container deployment.

Runtime adapters should remain thin. They translate transport-specific request and response details, then delegate to shared services. They should not own quote scoring, premium calculation, or KB business rules.

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
