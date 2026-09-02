import middy from "@middy/core";
import httpContentEncoding from "@middy/http-content-encoding";
import httpContentNegotiation from "@middy/http-content-negotiation";
import httpErrorHandler from "@middy/http-error-handler";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { errorResponse, jsonResponse } from "../api/http-response";
import { createQuoteEndpoint } from "../endpoints/create-quote.endpoint";

function lambdaHandler(event: APIGatewayProxyEvent, _context: Context): APIGatewayProxyResult {
  const requestBody = parseJsonBody(event);

  if (!requestBody.ok) {
    return errorResponse(requestBody.message);
  }

  const quoteResponse = createQuoteEndpoint(requestBody.value);

  return jsonResponse(quoteResponse.body, { statusCode: quoteResponse.statusCode });
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
