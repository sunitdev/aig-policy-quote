import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";

import { quoteRequestSchema, quoteResponseSchema } from "./quotes.contract";

describe("quotes contract", () => {
  describe("quoteRequestSchema", () => {
    it("accepts a direct quote factor object", () => {
      expect(
        quoteRequestSchema.parse({
          age: 24,
          propertyType: "Flat",
          propertyValue: 800000
        })
      ).toEqual({
        age: 24,
        propertyType: "Flat",
        propertyValue: 800000
      });
    });

    it("accepts an empty factor object", () => {
      expect(quoteRequestSchema.parse({})).toEqual({});
    });

    it("rejects non-object quote request bodies", () => {
      expect(() => quoteRequestSchema.parse(null)).toThrow(ZodError);
      expect(() => quoteRequestSchema.parse("invalid")).toThrow(ZodError);
      expect(() => quoteRequestSchema.parse([])).toThrow(ZodError);
    });
  });

  describe("quoteResponseSchema", () => {
    it("accepts the public quote response shape", () => {
      expect(
        quoteResponseSchema.parse({
          monthlyPremium: 30,
          annualPremium: 360,
          riskBand: "STANDARD",
          riskScore: 0,
          riskSummary: "STANDARD risk with score 0. No risk factors were applied.",
          coverageDetails: {
            basePremium: 300,
            riskMultiplier: 1,
            coverageLoadFactor: 1.2,
            coverage: 360
          },
          appliedFactors: []
        })
      ).toEqual({
        monthlyPremium: 30,
        annualPremium: 360,
        riskBand: "STANDARD",
        riskScore: 0,
        riskSummary: "STANDARD risk with score 0. No risk factors were applied.",
        coverageDetails: {
          basePremium: 300,
          riskMultiplier: 1,
          coverageLoadFactor: 1.2,
          coverage: 360
        },
        appliedFactors: []
      });
    });
  });
});
