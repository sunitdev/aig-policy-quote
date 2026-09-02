import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { handler } from "./create-quote";

function eventWithBody(body: string): APIGatewayProxyEvent {
  return {
    body,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false
  } as APIGatewayProxyEvent;
}

async function invokeCreateQuote(body: string): Promise<APIGatewayProxyResult> {
  return handler(eventWithBody(body), {} as Context);
}

const validHighRiskQuoteRequest = {
  age: 52,
  customerName: "Ada Lovelace",
  previousClaims: 3,
  propertyType: "House",
  propertyValue: 250000
};

describe("create quote handler", () => {
  it("returns a quote response for a valid direct factor object", async () => {
    const response = await invokeCreateQuote(JSON.stringify(validHighRiskQuoteRequest));

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-origin": "*",
      "cache-control": "no-transform",
      "content-type": "application/json"
    });
    expect(JSON.parse(response.body)).toMatchObject({
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

  it("returns 400 for an empty factor object that is missing required fields", async () => {
    const response = await invokeCreateQuote("{}");

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Quote request contains validation errors.",
      errors: {
        age: ["Age is required."],
        customerName: ["Full Name is required."]
      }
    });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await invokeCreateQuote("{");

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Request body must be valid JSON."
    });
  });

  it("returns 400 for JSON that is not a factor object", async () => {
    const response = await invokeCreateQuote("[]");

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Request body must be an object of quote factors."
    });
  });
});
