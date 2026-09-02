import type { UIInput } from "@policy-quote/api-contract";

import type { KnowledgeBaseV1, RiskFactorV1 } from "../services/knowledgeBase/types";

import { createQuoteEndpoint } from "./create-quote.endpoint";

let riskFactorId = 0;

const uiInputs: UIInput[] = [
  {
    id: "policyholderAlias",
    label: "Policyholder Alias",
    required: true,
    type: "text"
  },
  {
    id: "assetValue",
    label: "Asset Value",
    max: 500000,
    min: 100000,
    required: true,
    type: "number"
  },
  {
    id: "constructionStyle",
    label: "Construction Style",
    options: ["Detached", "Terraced"],
    required: true,
    type: "select"
  },
  {
    id: "optionalNotes",
    label: "Optional Notes",
    type: "text"
  }
];

function knowledgeBaseWithInputs(inputs: UIInput[], factors: RiskFactorV1[] = []): KnowledgeBaseV1 {
  return {
    kbSchemaVersion: "1.0.0",
    version: "quote-endpoint-test",
    basePremium: 300,
    coverageLoadFactor: 1.2,
    riskBands: {
      STANDARD: {
        min: 0,
        max: 25,
        riskMultiplier: 1
      },
      ELEVATED: {
        min: 26,
        max: 60,
        riskMultiplier: 1.5
      },
      HIGH_RISK: {
        min: 61,
        max: 999,
        riskMultiplier: 2.2
      }
    },
    uiInputs: inputs,
    factors
  };
}

function riskFactor(
  overrides: Pick<RiskFactorV1, "condition"> &
    Partial<Omit<RiskFactorV1, "condition" | "description">>
): RiskFactorV1 {
  return {
    id: `endpoint_factor_${String(riskFactorId++)}`,
    description: "Endpoint test factor",
    points: 10,
    ...overrides
  };
}

describe("createQuoteEndpoint", () => {
  it("returns field-level errors for missing required fields", () => {
    const result = createQuoteEndpoint(
      {},
      {
        knowledgeBase: knowledgeBaseWithInputs(uiInputs)
      }
    );

    expect(result).toEqual({
      statusCode: 400,
      body: {
        message: "Quote request contains validation errors.",
        errors: {
          assetValue: ["Asset Value is required."],
          constructionStyle: ["Construction Style is required."],
          policyholderAlias: ["Policyholder Alias is required."]
        }
      }
    });
  });

  it("returns field-level errors for wrong configured value types", () => {
    const result = createQuoteEndpoint(
      {
        assetValue: "250000",
        constructionStyle: 123,
        policyholderAlias: 456
      },
      {
        knowledgeBase: knowledgeBaseWithInputs(uiInputs)
      }
    );

    expect(result).toEqual({
      statusCode: 400,
      body: {
        message: "Quote request contains validation errors.",
        errors: {
          assetValue: ["Asset Value must be a number."],
          constructionStyle: ["Construction Style must be one of: Detached, Terraced."],
          policyholderAlias: ["Policyholder Alias must be a string."]
        }
      }
    });
  });

  it("returns field-level errors for number values outside configured min and max", () => {
    const result = createQuoteEndpoint(
      {
        assetValueHigh: 501,
        assetValueLow: 99
      },
      {
        knowledgeBase: knowledgeBaseWithInputs([
          {
            id: "assetValueLow",
            label: "Low Asset Value",
            min: 100,
            type: "number"
          },
          {
            id: "assetValueHigh",
            label: "High Asset Value",
            max: 500,
            type: "number"
          }
        ])
      }
    );

    expect(result).toEqual({
      statusCode: 400,
      body: {
        message: "Quote request contains validation errors.",
        errors: {
          assetValueHigh: ["High Asset Value must be at most 500."],
          assetValueLow: ["Low Asset Value must be at least 100."]
        }
      }
    });
  });

  it("returns field-level errors for invalid select options", () => {
    const result = createQuoteEndpoint(
      {
        constructionStyle: "Steel"
      },
      {
        knowledgeBase: knowledgeBaseWithInputs([
          {
            id: "constructionStyle",
            label: "Construction Style",
            options: ["Detached", "Terraced"],
            type: "select"
          }
        ])
      }
    );

    expect(result).toEqual({
      statusCode: 400,
      body: {
        message: "Quote request contains validation errors.",
        errors: {
          constructionStyle: ["Construction Style must be one of: Detached, Terraced."]
        }
      }
    });
  });

  it("allows optional empty values and unknown extra fields", () => {
    const result = createQuoteEndpoint(
      {
        assetValue: 250000,
        constructionStyle: "Detached",
        optionalNotes: "   ",
        policyholderAlias: "Quote A",
        unknownSignal: "allowed"
      },
      {
        knowledgeBase: knowledgeBaseWithInputs(uiInputs)
      }
    );

    expect(result.statusCode).toBe(200);
  });

  it("keeps quote calculation unchanged for valid configured requests", () => {
    const knowledgeBase = knowledgeBaseWithInputs(uiInputs, [
      riskFactor({
        condition: {
          field: "constructionStyle",
          operator: "eq",
          value: "Terraced"
        },
        points: 30
      })
    ]);

    const result = createQuoteEndpoint(
      {
        assetValue: 250000,
        constructionStyle: "Terraced",
        policyholderAlias: "Quote A"
      },
      {
        knowledgeBase
      }
    );

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        monthlyPremium: 45,
        annualPremium: 540,
        riskBand: "ELEVATED",
        riskScore: 30,
        appliedFactors: [
          {
            contribution: 30,
            description: "Endpoint test factor",
            id: knowledgeBase.factors[0].id,
            perOccurrence: false,
            points: 30
          }
        ]
      }
    });
  });
});
