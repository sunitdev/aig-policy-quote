import { z } from "zod";

export const quoteRequestSchema = z.record(z.string(), z.unknown());

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
export type RiskBand = z.infer<typeof riskBandSchema>;
export type AppliedFactor = z.infer<typeof appliedFactorSchema>;
export type CoverageDetails = z.infer<typeof coverageDetailsSchema>;
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;
