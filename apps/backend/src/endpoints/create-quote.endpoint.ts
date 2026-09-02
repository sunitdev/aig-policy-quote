import {
  quoteRequestSchema,
  type QuoteResponse,
  type QuoteValidationErrorResponse
} from "@policy-quote/api-contract";

import { createQuote } from "../services/policyQuote";
import {
  defaultRiskKnowledgeBasePath,
  getKnowledgeBase,
  type KnowledgeBaseV1
} from "../services/knowledgeBase";

import { validateQuoteRequest } from "./quote-request-validation";

export interface CreateQuoteEndpointSuccess {
  body: QuoteResponse;
  statusCode: 200;
}

export interface CreateQuoteEndpointError {
  body:
    | {
        message: string;
      }
    | QuoteValidationErrorResponse;
  statusCode: 400;
}

export type CreateQuoteEndpointResult = CreateQuoteEndpointSuccess | CreateQuoteEndpointError;

interface CreateQuoteEndpointOptions {
  knowledgeBase?: KnowledgeBaseV1;
  knowledgeBasePath?: string;
}

export function createQuoteEndpoint(
  requestBody: unknown,
  options: CreateQuoteEndpointOptions = {}
): CreateQuoteEndpointResult {
  const quoteRequest = quoteRequestSchema.safeParse(requestBody);

  if (!quoteRequest.success) {
    return {
      body: {
        message: "Request body must be an object of quote factors."
      },
      statusCode: 400
    };
  }

  const knowledgeBase =
    options.knowledgeBase ??
    getKnowledgeBase(options.knowledgeBasePath ?? getDefaultKnowledgeBasePath());
  const validationError = validateQuoteRequest(quoteRequest.data, knowledgeBase.uiInputs);

  if (validationError) {
    return {
      body: validationError,
      statusCode: 400
    };
  }

  return {
    body: createQuote(quoteRequest.data, {
      knowledgeBase
    }),
    statusCode: 200
  };
}

function getDefaultKnowledgeBasePath(): string {
  return process.env.RISK_KB_PATH ?? defaultRiskKnowledgeBasePath;
}

export type { CreateQuoteEndpointOptions };
