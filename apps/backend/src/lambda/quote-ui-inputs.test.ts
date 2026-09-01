import type { APIGatewayProxyEvent, Context } from "aws-lambda";

import { defaultRiskKnowledgeBasePath, getKnowledgeBase } from "../services/knowledgeBase";

import { handler } from "./quote-ui-inputs";

describe("quote UI inputs handler", () => {
  it("returns the raw uiInputs array from the knowledge base", async () => {
    const response = await handler(
      {
        headers: {},
        multiValueHeaders: {}
      } as APIGatewayProxyEvent,
      {} as Context
    );

    const knowledgeBase = getKnowledgeBase(defaultRiskKnowledgeBasePath);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "content-type": "application/json"
    });
    expect(JSON.parse(response.body)).toEqual(knowledgeBase.uiInputs);
  });
});
