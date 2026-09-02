import { quoteRequestSchema, type QuoteResponse } from "@policy-quote/api-contract";

import { createQuote } from "../services/policyQuote";

export interface CreateQuoteEndpointSuccess {
  body: QuoteResponse;
  statusCode: 200;
}

export interface CreateQuoteEndpointError {
  body: {
    message: string;
  };
  statusCode: 400;
}

export type CreateQuoteEndpointResult = CreateQuoteEndpointSuccess | CreateQuoteEndpointError;

export function createQuoteEndpoint(requestBody: unknown): CreateQuoteEndpointResult {
  const quoteRequest = quoteRequestSchema.safeParse(requestBody);

  if (!quoteRequest.success) {
    return {
      body: {
        message: "Request body must be an object of quote factors."
      },
      statusCode: 400
    };
  }

  return {
    body: createQuote(quoteRequest.data),
    statusCode: 200
  };
}
