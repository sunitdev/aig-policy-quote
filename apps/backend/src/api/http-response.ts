import type { APIGatewayProxyResult } from "aws-lambda";

interface JsonResponseOptions {
  headers?: Record<string, string>;
  statusCode?: number;
}

export function jsonResponse(
  body: unknown,
  { headers = {}, statusCode = 200 }: JsonResponseOptions = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  };
}
