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

export function errorResponse(
  message: string,
  options: Omit<JsonResponseOptions, "statusCode"> & { statusCode?: number } = {}
): APIGatewayProxyResult {
  return jsonResponse(
    {
      message
    },
    {
      ...options,
      statusCode: options.statusCode ?? 400
    }
  );
}
