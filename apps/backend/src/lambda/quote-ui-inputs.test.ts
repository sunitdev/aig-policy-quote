import type { APIGatewayProxyEvent, Context } from "aws-lambda";

import { defaultRiskKnowledgeBasePath, getKnowledgeBase } from "../services/knowledgeBase";

import { handler } from "./quote-ui-inputs";

function quoteUiInputsEvent(headers: APIGatewayProxyEvent["headers"] = {}): APIGatewayProxyEvent {
  return {
    body: null,
    headers,
    httpMethod: "GET",
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    path: "/policy/quote/ui-inputs",
    pathParameters: null,
    queryStringParameters: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: "/policy/quote/ui-inputs",
    stageVariables: null
  };
}

describe("quote UI inputs handler", () => {
  it("returns the raw uiInputs array from the knowledge base", async () => {
    const response = await handler(quoteUiInputsEvent(), {} as Context);

    const knowledgeBase = getKnowledgeBase(defaultRiskKnowledgeBasePath);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-origin": "*",
      "cache-control": "no-transform",
      "content-type": "application/json"
    });
    expect(JSON.parse(response.body)).toEqual(knowledgeBase.uiInputs);
  });

  it("does not content-encode the response when the browser accepts compression", async () => {
    const response = await handler(
      quoteUiInputsEvent({
        "accept-encoding": "gzip, deflate, br, zstd"
      }),
      {} as Context
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers).not.toHaveProperty("Content-Encoding");
    expect(response.headers).not.toHaveProperty("content-encoding");
    expect(response.isBase64Encoded).not.toBe(true);
    expect(() => {
      const parsedBody: unknown = JSON.parse(response.body);
      expect(parsedBody).toBeDefined();
    }).not.toThrow();
  });
});
