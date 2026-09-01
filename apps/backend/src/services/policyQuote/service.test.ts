import type { KnowledgeBaseV1, RiskFactorV1 } from "../knowledgeBase/types";

import { createQuote } from "./service";

let riskFactorId = 0;

function knowledgeBaseWithFactors(factors: RiskFactorV1[]): KnowledgeBaseV1 {
  return {
    kbSchemaVersion: "1.0.0",
    version: "quote-service-test",
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
    uiInputs: [],
    factors
  };
}

function riskFactor(
  overrides: Pick<RiskFactorV1, "condition"> &
    Partial<Omit<RiskFactorV1, "condition" | "description">>
): RiskFactorV1 {
  return {
    id: `quote_factor_${String(riskFactorId++)}`,
    description: "Quote test factor",
    points: 10,
    ...overrides
  };
}

describe("PolicyQuote service", () => {
  describe("createQuote", () => {
    it("returns a standard premium for an empty factor object", () => {
      const quote = createQuote({}, { knowledgeBase: knowledgeBaseWithFactors([]) });

      expect(quote).toMatchObject({
        monthlyPremium: 30,
        annualPremium: 360,
        riskBand: "STANDARD",
        riskScore: 0,
        coverageDetails: {
          basePremium: 300,
          riskMultiplier: 1,
          coverageLoadFactor: 1.2,
          coverage: 360
        },
        appliedFactors: []
      });
      expect(quote.riskSummary).toBe("STANDARD risk with score 0. No risk factors were applied.");
    });

    it("returns an elevated premium when matched factors score inside the elevated band", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "propertyType",
            operator: "eq",
            value: "Flat"
          },
          points: 30
        })
      ]);

      const quote = createQuote({ propertyType: "Flat" }, { knowledgeBase });

      expect(quote).toMatchObject({
        monthlyPremium: 45,
        annualPremium: 540,
        riskBand: "ELEVATED",
        riskScore: 30
      });
      expect(quote.appliedFactors).toEqual([
        {
          id: knowledgeBase.factors[0].id,
          description: "Quote test factor",
          points: 30,
          perOccurrence: false,
          contribution: 30
        }
      ]);
    });

    it("returns a high-risk premium when per-occurrence scoring reaches the high band", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "previousClaims",
            operator: "gte",
            value: 3
          },
          points: 30,
          perOccurrence: true
        })
      ]);

      const quote = createQuote({ previousClaims: 3 }, { knowledgeBase });

      expect(quote).toMatchObject({
        monthlyPremium: 66,
        annualPremium: 792,
        riskBand: "HIGH_RISK",
        riskScore: 90
      });
      expect(quote.appliedFactors[0]).toMatchObject({
        points: 30,
        perOccurrence: true,
        contribution: 90
      });
    });

    it("does not apply factors for wrong field names or wrong value types", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "propertyType",
            operator: "eq",
            value: "Flat"
          },
          points: 30
        }),
        riskFactor({
          condition: {
            field: "previousClaims",
            operator: "gte",
            value: 3
          },
          points: 30,
          perOccurrence: true
        })
      ]);

      const quote = createQuote(
        {
          propertyKind: "Flat",
          previousClaims: "3"
        },
        { knowledgeBase }
      );

      expect(quote).toMatchObject({
        monthlyPremium: 30,
        annualPremium: 360,
        riskBand: "STANDARD",
        riskScore: 0,
        appliedFactors: []
      });
    });

    it("rounds monthly premiums to two decimals", () => {
      const quote = createQuote(
        {},
        {
          knowledgeBase: {
            ...knowledgeBaseWithFactors([]),
            basePremium: 100,
            coverageLoadFactor: 1
          }
        }
      );

      expect(quote).toMatchObject({
        monthlyPremium: 8.33,
        annualPremium: 100
      });
    });
  });
});
