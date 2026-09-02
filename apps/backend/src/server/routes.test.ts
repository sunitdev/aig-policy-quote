import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { defaultRiskKnowledgeBasePath, getKnowledgeBase } from "../services/knowledgeBase";
import { handler as createQuoteHandler } from "../lambda/create-quote";

import { buildServer } from "./server";

function eventWithBody(body: string): APIGatewayProxyEvent {
  return {
    body,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false
  } as APIGatewayProxyEvent;
}

async function invokeCreateQuoteLambda(body: string): Promise<APIGatewayProxyResult> {
  return createQuoteHandler(eventWithBody(body), {} as Context);
}

const validHighRiskQuoteRequest = {
  age: 52,
  customerName: "Ada Lovelace",
  previousClaims: 3,
  propertyType: "House",
  propertyValue: 250000
};

describe("Fastify backend routes", () => {
  const server = buildServer();

  afterAll(async () => {
    await server.close();
  });

  it("returns the shared health response", async () => {
    const response = await server.inject({
      headers: {
        origin: "http://localhost:4200"
      },
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("*");
    expect(response.headers["cache-control"]).toBe("no-transform");
    expect(response.json()).toEqual({
      status: "ok"
    });
  });

  it("returns UI inputs from the knowledge base", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/policy/quote/ui-inputs"
    });
    const knowledgeBase = getKnowledgeBase(defaultRiskKnowledgeBasePath);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(knowledgeBase.uiInputs);
  });

  it("returns the same quote response body as the Lambda route for valid input", async () => {
    const requestBody = JSON.stringify(validHighRiskQuoteRequest);
    const [fastifyResponse, lambdaResponse] = await Promise.all([
      server.inject({
        headers: {
          "content-type": "application/json"
        },
        method: "POST",
        payload: requestBody,
        url: "/policy/quote"
      }),
      invokeCreateQuoteLambda(requestBody)
    ]);

    expect(fastifyResponse.statusCode).toBe(lambdaResponse.statusCode);
    expect(fastifyResponse.json()).toEqual(JSON.parse(lambdaResponse.body));
    expect(fastifyResponse.json()).toMatchObject({
      monthlyPremium: 66,
      annualPremium: 792,
      riskBand: "HIGH_RISK",
      riskScore: 90,
      coverageDetails: {
        basePremium: 300,
        riskMultiplier: 2.2,
        coverageLoadFactor: 1.2,
        coverage: 792
      },
      appliedFactors: [
        {
          id: "previous_claims_high",
          description: "3 or more previous claims",
          points: 30,
          perOccurrence: true,
          contribution: 90
        }
      ]
    });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await server.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: "{",
      url: "/policy/quote"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Request body must be valid JSON."
    });
  });

  it("returns 400 when the request body is missing", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/policy/quote"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Request body is required."
    });
  });

  it("returns 400 when JSON is not a factor object", async () => {
    const response = await server.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: "[]",
      url: "/policy/quote"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Request body must be an object of quote factors."
    });
  });
});
