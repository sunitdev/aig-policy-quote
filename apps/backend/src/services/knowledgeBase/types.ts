import { z } from "zod";

const comparisonValueV1Schema = z.union([z.string(), z.number(), z.boolean()]);

const baseUiInputV1Schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  required: z.boolean().optional()
});

export const uiInputV1Schema = z.discriminatedUnion("type", [
  baseUiInputV1Schema.extend({
    type: z.literal("text")
  }),
  baseUiInputV1Schema.extend({
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional()
  }),
  baseUiInputV1Schema.extend({
    type: z.literal("select"),
    options: z.array(z.string().min(1)).min(1)
  })
]);

export const simpleConditionV1Schema = z.discriminatedUnion("operator", [
  z.object({
    field: z.string().min(1),
    operator: z.literal("eq"),
    value: comparisonValueV1Schema
  }),
  z.object({
    field: z.string().min(1),
    operator: z.literal("gt"),
    value: z.number()
  }),
  z.object({
    field: z.string().min(1),
    operator: z.literal("gte"),
    value: z.number()
  }),
  z.object({
    field: z.string().min(1),
    operator: z.literal("between"),
    min: z.number(),
    max: z.number()
  }),
  z.object({
    field: z.string().min(1),
    operator: z.literal("outside_range"),
    min: z.number(),
    max: z.number()
  })
]);

export type SimpleConditionV1 = z.infer<typeof simpleConditionV1Schema>;
export type RiskOperatorV1 = SimpleConditionV1["operator"];

export type KnowledgeBaseConditionV1 =
  | SimpleConditionV1
  | {
      all: KnowledgeBaseConditionV1[];
    }
  | {
      or: KnowledgeBaseConditionV1[];
    };

export const knowledgeBaseConditionV1Schema: z.ZodType<KnowledgeBaseConditionV1> = z.lazy(() =>
  z.union([
    simpleConditionV1Schema,
    z.object({
      all: z.array(knowledgeBaseConditionV1Schema).min(1)
    }),
    z.object({
      or: z.array(knowledgeBaseConditionV1Schema).min(1)
    })
  ])
);

export const riskBandV1Schema = z.object({
  min: z.number(),
  max: z.number(),
  riskMultiplier: z.number()
});

export const riskFactorV1Schema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  condition: knowledgeBaseConditionV1Schema,
  points: z.number(),
  perOccurrence: z.boolean().optional()
});

export type RiskFactorV1 = z.infer<typeof riskFactorV1Schema>;

export const knowledgeBaseV1Schema = z.object({
  kbSchemaVersion: z.literal("1.0.0"),
  version: z.string().min(1),
  basePremium: z.number(),
  coverageLoadFactor: z.number(),
  riskBands: z.object({
    STANDARD: riskBandV1Schema,
    ELEVATED: riskBandV1Schema,
    HIGH_RISK: riskBandV1Schema
  }),
  uiInputs: z.array(uiInputV1Schema),
  factors: z.array(riskFactorV1Schema)
});

export type KnowledgeBaseV1 = z.infer<typeof knowledgeBaseV1Schema>;
