import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";

import {
  quoteRequestSchema,
  quoteResponseSchema,
  quoteValidationErrorResponseSchema,
  uiInputsResponseSchema
} from "./quotes.contract";

describe("quotes contract", () => {
  describe("uiInputsResponseSchema", () => {
    it("accepts the public quote UI input response shape", () => {
      expect(
        uiInputsResponseSchema.parse([
          {
            id: "customerName",
            type: "text",
            label: "Full Name",
            description: "Full name of the policyholder",
            required: true
          },
          {
            id: "age",
            label: "Age",
            description: "Age of the policyholder",
            required: true,
            type: "number",
            min: 18,
            max: 100
          },
          {
            id: "propertyType",
            type: "select",
            label: "Type of property",
            options: ["House", "Flat", "Bungalow"]
          }
        ])
      ).toEqual([
        {
          id: "customerName",
          type: "text",
          label: "Full Name",
          description: "Full name of the policyholder",
          required: true
        },
        {
          id: "age",
          label: "Age",
          description: "Age of the policyholder",
          required: true,
          type: "number",
          min: 18,
          max: 100
        },
        {
          id: "propertyType",
          type: "select",
          label: "Type of property",
          options: ["House", "Flat", "Bungalow"]
        }
      ]);
    });
  });

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

  describe("quoteValidationErrorResponseSchema", () => {
    it("accepts field-level quote validation errors", () => {
      expect(
        quoteValidationErrorResponseSchema.parse({
          message: "Quote request contains validation errors.",
          errors: {
            age: ["Age is required."],
            propertyType: ["Property Type must be one of: House, Flat."]
          }
        })
      ).toEqual({
        message: "Quote request contains validation errors.",
        errors: {
          age: ["Age is required."],
          propertyType: ["Property Type must be one of: House, Flat."]
        }
      });
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
