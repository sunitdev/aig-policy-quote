import middy from "@middy/core";
import httpContentEncoding from "@middy/http-content-encoding";
import httpContentNegotiation from "@middy/http-content-negotiation";
import httpErrorHandler from "@middy/http-error-handler";
import { quoteRequestSchema } from "@policy-quote/api-contract";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { errorResponse, jsonResponse } from "../api/http-response";
import { createQuote } from "../services/policyQuote";

function lambdaHandler(event: APIGatewayProxyEvent, _context: Context): APIGatewayProxyResult {
  const requestBody = parseJsonBody(event);

  if (!requestBody.ok) {
    return errorResponse(requestBody.message);
  }

  const quoteRequest = quoteRequestSchema.safeParse(requestBody.value);

  if (!quoteRequest.success) {
    return errorResponse("Request body must be an object of quote factors.");
  }

  return jsonResponse(createQuote(quoteRequest.data));
}

function parseJsonBody(
  event: APIGatewayProxyEvent
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (!event.body) {
    return {
      ok: false,
      message: "Request body is required."
    };
  }

  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    return {
      ok: true,
      value: JSON.parse(body) as unknown
    };
  } catch {
    return {
      ok: false,
      message: "Request body must be valid JSON."
    };
  }
}

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(httpContentNegotiation())
  .use(httpContentEncoding())
  .use(httpErrorHandler())
  .handler(lambdaHandler);
