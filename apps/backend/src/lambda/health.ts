import middy from "@middy/core";
import httpContentEncoding from "@middy/http-content-encoding";
import httpContentNegotiation from "@middy/http-content-negotiation";
import httpErrorHandler from "@middy/http-error-handler";
import { healthResponseSchema, type HealthResponse } from "@policy-quote/api-contract";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { jsonResponse } from "../api/http-response";

function lambdaHandler(_event: APIGatewayProxyEvent, _context: Context): APIGatewayProxyResult {
  const responseBody: HealthResponse = healthResponseSchema.parse({
    status: "ok"
  });

  return jsonResponse(responseBody);
}

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(httpContentNegotiation())
  .use(httpContentEncoding())
  .use(httpErrorHandler())
  .handler(lambdaHandler);
