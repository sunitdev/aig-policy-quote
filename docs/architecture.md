# PolicyQuote Architecture

## Overview

PolicyQuote is an application for producing policy quotes from customer and property details. It renders quote inputs from a versioned knowledge base, calculates risk from KB factors, applies premium settings, and returns a quote with an explanation of the factors that affected the result.

The key architectural principle is KB-driven scoring: business scoring rules live in `kb/risk-kb.json`, while application code provides generic loading, validation, evaluation, and presentation behavior.

## System Goals

- Produce consistent policy quotes through a documented scoring model.
- Keep quote inputs and risk factors configurable through the knowledge base.
- Share API contracts between frontend and backend to avoid request/response drift.
- Keep the backend authoritative for validation, scoring, and premium calculation.
- Keep the frontend focused on data entry, usability, and quote presentation.
- Support both Lambda-style and container-style backend runtime paths through a shared business core.

## Monorepo Organization

The project is organized as a pnpm and Turborepo workspace:

```text
policy-quote/
  apps/
    backend/              # Policy quote API and backend runtime adapters
    frontend/             # Angular policy quote user interface
  packages/
    api-contract/         # Shared Zod schemas and TypeScript API types
  kb/
    risk-kb.json          # Versioned policy quote knowledge base
  docs/
    architecture.md       # System-level architecture
    backend.md            # Backend organization and responsibilities
    frontend.md           # Frontend organization and responsibilities
    kb.md                 # Knowledge base schema and rule examples
```

The workspace packages have distinct responsibilities:

- `@policy-quote/backend` owns quote processing, risk evaluation, premium calculation, and API responses.
- `@policy-quote/frontend` owns the browser experience for entering quote details and reading results.
- `@policy-quote/api-contract` owns shared request and response schemas.
- `kb/risk-kb.json` owns UI input definitions, rating data, risk bands, and risk factors.

## High-Level Request Flow

```text
Browser
  -> GET /policy/quote/ui-inputs
  -> KB-defined uiInputs from risk-kb.json
  -> Angular renders quote form
  -> policy quote submission API
  -> POST /policy/quote
  -> backend route adapter
  -> shared quote service
  -> validated API contract
  -> calculate risk using risk engine
  -> premium calculator
  -> quote response
  -> Angular result view
```

Request flow responsibilities:

1. The frontend requests quote UI metadata from the backend.
2. The backend reads `uiInputs` from `kb/risk-kb.json` and returns the field definitions.
3. Angular renders the quote form from the returned UI metadata.
4. The user enters customer and property details.
5. The frontend API service sends the completed request to `POST /policy/quote`.
6. The backend validates the request using the shared contract and KB input metadata.
7. The quote service coordinates risk evaluation and premium calculation.
8. The risk engine evaluates KB factors and returns a risk score plus applied factors.
9. The risk-band resolver maps the score to a band from the KB.
10. The premium calculator applies `basePremium`, `riskMultiplier`, and `coverageLoadFactor`.
11. The response mapper returns premiums, band, score, explanation, coverage details, applied factors, and KB version.
12. The frontend renders the quote result without recalculating scoring logic.

## Backend Runtime Architecture

The backend uses one business core with two runtime adapters:

- Lambda adapter: API Gateway event, Middy middleware, route table, shared services.
- HTTP adapter: Fastify server for local container or Fargate-style deployment, shared services.

Both adapters call the same quote service, health service, KB runtime, and risk engine. Runtime-specific code handles transport details only; it does not own scoring rules or premium behavior.

## Backend Business Core

The backend business core is organized around a small set of services:

- Contract service: validates quote requests and response shapes shared by frontend and backend.
- Knowledge base service: loads `kb/risk-kb.json`, validates the schema, and exposes UI input and rating data.
- Risk service: evaluates quote input against KB factors and returns the risk score, risk band, and applied factors.
- Premium service: calculates annual and monthly premiums from KB rating settings and the risk result.
- Quote service: coordinates validation, risk evaluation, premium calculation, and response mapping for `POST /policy/quote`.
- Health service: reports service status and the active KB version.

This keeps insurance-specific values in the KB and keeps TypeScript code generic.

## Frontend Architecture

The frontend uses Angular standalone components. The quote page composes smaller single-purpose pieces:

- form construction owns Reactive Form controls and validators.
- page component owns submit flow and local Signals state.
- API service owns HTTP calls.
- view model helpers own display formatting.
- shared UI components own reusable input, alert, button, and badge rendering.

The frontend should show validation hints and errors, but it should not become the authority for whether a quote is valid or what risk score applies.

## Knowledge Base Architecture

`kb/risk-kb.json` contains:

- `kbSchemaVersion`: schema version for the KB file shape.
- `version`: active KB version.
- `basePremium`: base premium value.
- `coverageLoadFactor`: coverage multiplier.
- `riskBands`: configured score ranges and premium multipliers.
- `uiInputs`: field definitions for the quote form.
- `factors`: rating factors with field conditions and point values.

The scoring model is table-driven. Each factor is data that describes:

- what input field to inspect
- which generic operator to apply
- which comparison value or range to use
- how many points to add
- whether points apply once or per occurrence
- whether multiple nested conditions must all match

The engine evaluates these rows generically. Adding a factor for an already-supported field and operator should only require a KB update.

## Quote Response Shape

The quote API response should include:

- `monthlyPremium`
- `annualPremium`
- `riskBand`
- `riskScore`
- `riskSummary`
- `coverageDetails`
- `appliedFactors`
- `kbVersion`

`appliedFactors` is important because it makes the quote explainable. The UI can show which KB rules matched without knowing how to score the quote itself.

## Premium Calculation

The premium calculation uses KB rating values:

```text
basePremium x riskMultiplier x coverageLoadFactor
```

The selected `riskMultiplier` comes from the resolved risk band. The backend should calculate both annual and monthly premiums consistently from the same annual premium result.

## API And Contract Boundary

The API boundary is the contract between the Angular frontend and the backend quote services. It should stay small and focused on two flows:

- UI metadata flow: the frontend fetches quote form definitions backed by `uiInputs` in `kb/risk-kb.json`.
- Quote flow: the frontend submits completed quote details and receives premiums, risk results, applied factors, and KB version.

The shared contract package should define schemas and TypeScript types for both flows:

- UI metadata response contract.
- Quote request contract.
- Quote response contract.
- Shared risk band and applied factor types.

The backend uses these contracts for validation and response shaping. The frontend uses them to render API-driven UI safely and submit quote requests without duplicating backend business rules.

## Deployment Model

The backend supports two deployment styles through shared services:

- Lambda: `handler.ts` wrapped by Middy for API Gateway.
- Container: `server.ts` running Fastify for local HTTP or Fargate-style runtime.

The container path should run the compiled Fastify server. It should not invoke the Lambda handler internally.

## Documentation Map

- `docs/backend.md`: backend package organization, components, and single-responsibility boundaries.
- `docs/frontend.md`: frontend package organization, components, state, and UI boundaries.
- `docs/kb.md`: KB structure, operators, factor examples, and rule-change guidance.
