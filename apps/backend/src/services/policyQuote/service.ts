import {
  quoteResponseSchema,
  riskBandSchema,
  type QuoteRequest,
  type QuoteResponse,
  type RiskBand
} from "@policy-quote/api-contract";

import { defaultRiskKnowledgeBasePath, getKnowledgeBase } from "../knowledgeBase";
import type { KnowledgeBaseV1 } from "../knowledgeBase";
import { evaluateRisk } from "../riskEngine";
import { roundCurrency } from "../../utils/currency";

interface CreateQuoteOptions {
  knowledgeBase?: KnowledgeBaseV1;
  knowledgeBasePath?: string;
}

export function createQuote(
  factors: QuoteRequest,
  options: CreateQuoteOptions = {}
): QuoteResponse {
  const knowledgeBase =
    options.knowledgeBase ??
    getKnowledgeBase(options.knowledgeBasePath ?? getDefaultKnowledgeBasePath());
  const riskEvaluation = evaluateRisk(factors, knowledgeBase);
  const riskBand = resolveRiskBand(riskEvaluation.riskScore, knowledgeBase);
  const riskMultiplier = knowledgeBase.riskBands[riskBand].riskMultiplier;
  const annualPremium = roundCurrency(
    knowledgeBase.basePremium * riskMultiplier * knowledgeBase.coverageLoadFactor
  );
  const monthlyPremium = roundCurrency(annualPremium / 12);

  return quoteResponseSchema.parse({
    monthlyPremium,
    annualPremium,
    riskBand,
    riskScore: riskEvaluation.riskScore,
    riskSummary: createRiskSummary(
      riskBand,
      riskEvaluation.riskScore,
      riskEvaluation.appliedFactors
    ),
    coverageDetails: {
      basePremium: knowledgeBase.basePremium,
      riskMultiplier,
      coverageLoadFactor: knowledgeBase.coverageLoadFactor,
      coverage: annualPremium
    },
    appliedFactors: riskEvaluation.appliedFactors
  });
}

function getDefaultKnowledgeBasePath(): string {
  return process.env.RISK_KB_PATH ?? defaultRiskKnowledgeBasePath;
}

function resolveRiskBand(riskScore: number, knowledgeBase: KnowledgeBaseV1): RiskBand {
  const matchingBand = Object.entries(knowledgeBase.riskBands).find(
    ([, band]) => riskScore >= band.min && riskScore <= band.max
  );

  if (!matchingBand) {
    throw new Error(`No risk band configured for risk score: ${String(riskScore)}`);
  }

  return riskBandSchema.parse(matchingBand[0]);
}

function createRiskSummary(
  riskBand: RiskBand,
  riskScore: number,
  appliedFactors: QuoteResponse["appliedFactors"]
): string {
  if (appliedFactors.length === 0) {
    return `${riskBand} risk with score ${String(riskScore)}. No risk factors were applied.`;
  }

  const factorDescriptions = appliedFactors
    .map((appliedFactor) => appliedFactor.description)
    .join("; ");

  return `${riskBand} risk with score ${String(riskScore)}. Applied factors: ${factorDescriptions}.`;
}

export type { CreateQuoteOptions, QuoteRequest, QuoteResponse };
