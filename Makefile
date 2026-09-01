PNPM ?= pnpm
SAM ?= sam
SAM_PORT ?= 3000
CDK_TEMPLATE ?= packages/infra/cdk.out/PolicyQuoteInfraStack.template.json

.DEFAULT_GOAL := help

.PHONY: help install dev-serverless frontend-up dev-serverless-api build test lint typecheck format-check serverless-api-synth serverless-api-up

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make install' \
		'  make dev-serverless' \
		'  make frontend-up' \
		'  make dev-serverless-api' \
		'  make build' \
		'  make test' \
		'  make lint' \
		'  make typecheck' \
		'  make format-check' \
		'  make serverless-api-synth' \
		'  make serverless-api-up'

install:
	$(PNPM) install

dev-serverless:
	@$(MAKE) dev-serverless-api & \
	api_pid=$$!; \
	$(MAKE) frontend-up & \
	frontend_pid=$$!; \
	trap 'kill $$api_pid $$frontend_pid 2>/dev/null; wait $$api_pid $$frontend_pid 2>/dev/null' INT TERM EXIT; \
	while :; do \
		if ! kill -0 $$api_pid 2>/dev/null; then \
			wait $$api_pid; \
			status=$$?; \
			kill $$frontend_pid 2>/dev/null; \
			wait $$frontend_pid 2>/dev/null; \
			exit $$status; \
		fi; \
		if ! kill -0 $$frontend_pid 2>/dev/null; then \
			wait $$frontend_pid; \
			status=$$?; \
			kill $$api_pid 2>/dev/null; \
			wait $$api_pid 2>/dev/null; \
			exit $$status; \
		fi; \
		sleep 1; \
	done

frontend-up:
	$(PNPM) --filter @policy-quote/frontend --fail-if-no-match dev

dev-serverless-api: serverless-api-up

build:
	$(PNPM) run build

test:
	$(PNPM) run test

lint:
	$(PNPM) run lint

typecheck:
	$(PNPM) run typecheck

format-check:
	$(PNPM) run format:check

serverless-api-synth:
	$(PNPM) --filter @policy-quote/infra --fail-if-no-match synth

serverless-api-up: serverless-api-synth
	$(SAM) local start-api -t $(CDK_TEMPLATE) --port $(SAM_PORT)
