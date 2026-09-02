import { z } from "zod";

const baseUiInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  required: z.boolean().optional()
});

export const uiInputSchema = z.discriminatedUnion("type", [
  baseUiInputSchema.extend({
    type: z.literal("text")
  }),
  baseUiInputSchema.extend({
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional()
  }),
  baseUiInputSchema.extend({
    type: z.literal("select"),
    options: z.array(z.string().min(1)).min(1)
  })
]);

export const uiInputsResponseSchema = z.array(uiInputSchema);

export const quoteRequestSchema = z.record(z.string(), z.unknown());

export const quoteValidationErrorResponseSchema = z.object({
  message: z.string().min(1),
  errors: z.record(z.string(), z.array(z.string().min(1)))
});

export const riskBandSchema = z.enum(["STANDARD", "ELEVATED", "HIGH_RISK"]);

export const appliedFactorSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  points: z.number(),
  perOccurrence: z.boolean(),
  contribution: z.number()
});

export const coverageDetailsSchema = z.object({
  basePremium: z.number(),
  riskMultiplier: z.number(),
  coverageLoadFactor: z.number(),
  coverage: z.number()
});

export const quoteResponseSchema = z.object({
  monthlyPremium: z.number(),
  annualPremium: z.number(),
  riskBand: riskBandSchema,
  riskScore: z.number(),
  riskSummary: z.string().min(1),
  coverageDetails: coverageDetailsSchema,
  appliedFactors: z.array(appliedFactorSchema)
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type QuoteValidationErrorResponse = z.infer<typeof quoteValidationErrorResponseSchema>;
export type UIInput = z.infer<typeof uiInputSchema>;
export type UIInputsResponse = z.infer<typeof uiInputsResponseSchema>;
export type RiskBand = z.infer<typeof riskBandSchema>;
export type AppliedFactor = z.infer<typeof appliedFactorSchema>;
export type CoverageDetails = z.infer<typeof coverageDetailsSchema>;
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;
