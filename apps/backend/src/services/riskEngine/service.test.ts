import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defaultRiskKnowledgeBasePath } from "../knowledgeBase/constants";
import { parseKnowledgeBase } from "../knowledgeBase/service";
import type { KnowledgeBaseV1, RiskFactorV1 } from "../knowledgeBase/types";

import { evaluateRisk } from "./service";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../../..");
const riskKnowledgeBasePath = join(repoRoot, defaultRiskKnowledgeBasePath);
let riskFactorId = 0;

function knowledgeBaseWithFactors(factors: RiskFactorV1[]): KnowledgeBaseV1 {
  return {
    kbSchemaVersion: "1.0.0",
    version: "risk-engine-test",
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
    id: `test_factor_${String(riskFactorId++)}`,
    description: "Test factor",
    points: 10,
    ...overrides
  };
}

function matchingFactorIds(
  factors: Record<string, unknown>,
  knowledgeBase: KnowledgeBaseV1
): string[] {
  return evaluateRisk(factors, knowledgeBase).appliedFactors.map((riskFactor) => riskFactor.id);
}

describe("RiskEngine service", () => {
  describe("evaluateRisk", () => {
    it("evaluates matching factors from the real risk knowledge base", () => {
      const knowledgeBase = parseKnowledgeBase(readFileSync(riskKnowledgeBasePath, "utf8"));

      const riskEvaluation = evaluateRisk(
        {
          age: 24,
          previousClaims: 2,
          propertyType: "Flat",
          propertyValue: 800000
        },
        knowledgeBase
      );

      expect(riskEvaluation.appliedFactors.map((riskFactor) => riskFactor.id)).toEqual([
        "age_young_elderly",
        "previous_claims_low",
        "property_type_flat",
        "property_value_high",
        "flat_and_property_value_high"
      ]);
      expect(riskEvaluation.riskScore).toBe(120);
    });

    it("multiplies matched simple numeric factors when perOccurrence is configured", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "previousClaims",
            operator: "between",
            min: 1,
            max: 2
          },
          points: 15,
          perOccurrence: true
        })
      ]);

      expect(evaluateRisk({ previousClaims: 2 }, knowledgeBase)).toEqual({
        appliedFactors: [
          {
            id: knowledgeBase.factors[0].id,
            description: "Test factor",
            points: 15,
            perOccurrence: true,
            contribution: 30
          }
        ],
        riskScore: 30
      });
    });

    it("uses strict equality for matching primitive values", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "propertyType",
            operator: "eq",
            value: "Flat"
          },
          points: 10
        }),
        riskFactor({
          condition: {
            field: "propertyType",
            operator: "eq",
            value: "House"
          },
          points: 20
        }),
        riskFactor({
          condition: {
            field: "hasAlarm",
            operator: "eq",
            value: true
          },
          points: 5
        }),
        riskFactor({
          condition: {
            field: "hasAlarm",
            operator: "eq",
            value: "true"
          },
          points: 50
        })
      ]);

      expect(matchingFactorIds({ propertyType: "Flat", hasAlarm: true }, knowledgeBase)).toEqual([
        knowledgeBase.factors[0].id,
        knowledgeBase.factors[2].id
      ]);
    });

    it("evaluates numeric comparison operators and inclusive boundaries", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "propertyValue",
            operator: "gt",
            value: 750000
          },
          points: 10
        }),
        riskFactor({
          condition: {
            field: "previousClaims",
            operator: "gte",
            value: 3
          },
          points: 20
        }),
        riskFactor({
          condition: {
            field: "age",
            operator: "between",
            min: 25,
            max: 75
          },
          points: 30
        }),
        riskFactor({
          condition: {
            field: "distanceFromCoast",
            operator: "outside_range",
            min: 5,
            max: 100
          },
          points: 40
        })
      ]);

      expect(
        matchingFactorIds(
          {
            propertyValue: 750001,
            previousClaims: 3,
            age: 75,
            distanceFromCoast: 4
          },
          knowledgeBase
        )
      ).toEqual(knowledgeBase.factors.map((riskFactor) => riskFactor.id));
    });

    it("does not match numeric operators for boundary misses, missing fields, or wrong value types", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            field: "propertyValue",
            operator: "gt",
            value: 750000
          },
          points: 10
        }),
        riskFactor({
          condition: {
            field: "previousClaims",
            operator: "gte",
            value: 3
          },
          points: 20
        }),
        riskFactor({
          condition: {
            field: "age",
            operator: "between",
            min: 25,
            max: 75
          },
          points: 30
        }),
        riskFactor({
          condition: {
            field: "distanceFromCoast",
            operator: "outside_range",
            min: 5,
            max: 100
          },
          points: 40
        })
      ]);

      expect(
        evaluateRisk(
          {
            propertyValue: 750000,
            previousClaims: "3",
            age: 76
          },
          knowledgeBase
        ).appliedFactors
      ).toEqual([]);
    });

    it("requires every condition in an all group to match", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            all: [
              {
                field: "propertyType",
                operator: "eq",
                value: "Flat"
              },
              {
                field: "propertyValue",
                operator: "gt",
                value: 500000
              }
            ]
          },
          points: 35
        })
      ]);

      expect(
        matchingFactorIds({ propertyType: "Flat", propertyValue: 500001 }, knowledgeBase)
      ).toEqual([knowledgeBase.factors[0].id]);
      expect(
        evaluateRisk({ propertyType: "Flat", propertyValue: 500000 }, knowledgeBase).appliedFactors
      ).toEqual([]);
    });

    it("matches an or group when at least one condition matches", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            or: [
              {
                field: "propertyType",
                operator: "eq",
                value: "House"
              },
              {
                field: "propertyType",
                operator: "eq",
                value: "Bungalow"
              }
            ]
          },
          points: 5
        })
      ]);

      expect(matchingFactorIds({ propertyType: "Bungalow" }, knowledgeBase)).toEqual([
        knowledgeBase.factors[0].id
      ]);
      expect(evaluateRisk({ propertyType: "Flat" }, knowledgeBase).appliedFactors).toEqual([]);
    });

    it("recursively evaluates nested compound conditions", () => {
      const knowledgeBase = knowledgeBaseWithFactors([
        riskFactor({
          condition: {
            or: [
              {
                all: [
                  {
                    field: "propertyType",
                    operator: "eq",
                    value: "Flat"
                  },
                  {
                    field: "propertyValue",
                    operator: "gt",
                    value: 500000
                  }
                ]
              },
              {
                all: [
                  {
                    field: "propertyValue",
                    operator: "gt",
                    value: 500000
                  },
                  {
                    field: "previousClaims",
                    operator: "gte",
                    value: 3
                  }
                ]
              }
            ]
          },
          points: 55
        })
      ]);

      expect(
        matchingFactorIds(
          {
            propertyType: "House",
            propertyValue: 600000,
            previousClaims: 3
          },
          knowledgeBase
        )
      ).toEqual([knowledgeBase.factors[0].id]);
      expect(
        evaluateRisk(
          {
            propertyType: "House",
            propertyValue: 600000,
            previousClaims: 2
          },
          knowledgeBase
        ).appliedFactors
      ).toEqual([]);
    });

    it("ignores unsupported operators if invalid data reaches the engine", () => {
      const unsupportedOperatorFactor = {
        id: "unsupported_operator",
        description: "Unsupported operator",
        condition: {
          field: "age",
          operator: "lt",
          value: 25
        },
        points: 10
      } as unknown as RiskFactorV1;

      const knowledgeBase = knowledgeBaseWithFactors([unsupportedOperatorFactor]);

      expect(evaluateRisk({ age: 24 }, knowledgeBase).appliedFactors).toEqual([]);
    });
  });
});
