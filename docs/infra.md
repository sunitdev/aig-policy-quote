# Infrastructure Design

## Overview

CDK is the source of truth for deployable AWS infrastructure. The backend supports two runtime styles:

- Lambda/API Gateway: three small Lambda functions, one per public endpoint.
- Container/Fargate: one Fastify server process that mounts the same public endpoints.

Both runtime styles must use the same backend services. Infrastructure code wires runtimes and AWS resources; it does not contain policy quote scoring rules, premium values, or KB-specific business decisions.

## CDK Ownership

The CDK app should define:

- one API Gateway REST or HTTP API
- `GET /health` routed to the health Lambda function
- `GET /policy/quote/ui-inputs` routed to the quote UI inputs Lambda function
- `POST /policy/quote` routed to the create quote Lambda function
- optional ECR, ECS cluster, Fargate service, task definition, and load balancer for the Fastify container path

CDK replaces a hand-written SAM template. If SAM CLI is used locally, it should consume the CloudFormation template produced by `cdk synth`.

## Lambda Runtime

The Lambda path has three exported handlers:

```text
apps/backend/src/lambda/
  health.ts                         # exports handler for GET /health
  quote-ui-inputs.ts                # exports handler for GET /policy/quote/ui-inputs
  create-quote.ts                   # exports handler for POST /policy/quote
```

Each handler adapts API Gateway event details, applies Lambda-specific middleware or error handling, and calls a shared endpoint function. Handlers should not calculate premiums, evaluate risk factors, or read insurance-specific scoring values directly.

## Fargate Runtime

The Fargate path runs a compiled Fastify server:

```text
Application Load Balancer
  -> Fargate task
  -> container port
  -> Fastify server
  -> shared backend endpoint functions
  -> quote, health, KB, risk, and premium services
```

Fastify should not invoke Lambda handlers. It should mount HTTP routes that call the same shared endpoint functions used underneath the Lambda adapters.

## Local Workflows

Primary Lambda-local workflow:

```sh
pnpm --filter @policy-quote/infra synth
sam local start-api -t <cdk.out template path>
```

Container-style local workflow:

```sh
pnpm --filter @policy-quote/backend build
docker build -f apps/backend/Dockerfile -t policy-quote-backend .
docker run --rm -p 3000:3000 policy-quote-backend
```

Fast local HTTP workflow, if provided by the backend package:

```sh
pnpm --filter @policy-quote/backend dev
```

## Boundaries

- `kb/risk-kb.json` remains the only place for insurance scoring values.
- CDK owns infrastructure wiring and runtime configuration.
- Lambda adapters own API Gateway input/output translation.
- Fastify owns long-running HTTP serving for Docker and Fargate.
- Shared backend services own validation, quote orchestration, KB loading, risk scoring, premium calculation, and health data.

## Verification

Infrastructure and runtime verification should include:

- `cdk synth` succeeds.
- `sam local start-api` starts from the synthesized template.
- all three public endpoints respond through SAM local.
- the Docker/Fastify container starts and serves all three endpoints.
- Lambda handler tests and Fastify route tests prove both adapters return equivalent API behavior.
