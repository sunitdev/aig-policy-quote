import middy from "@middy/core";
import httpContentEncoding from "@middy/http-content-encoding";
import httpContentNegotiation from "@middy/http-content-negotiation";
import httpErrorHandler from "@middy/http-error-handler";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { jsonResponse } from "../api/http-response";
import { getQuoteUIInputsEndpoint } from "../endpoints/quote-ui-inputs.endpoint";

function lambdaHandler(_event: APIGatewayProxyEvent, _context: Context): APIGatewayProxyResult {
  return jsonResponse(getQuoteUIInputsEndpoint());
}

export const handler = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
  .use(httpContentNegotiation())
  .use(httpContentEncoding())
  .use(httpErrorHandler())
  .handler(lambdaHandler);
