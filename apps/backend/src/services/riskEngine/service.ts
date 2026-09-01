import type {
  KnowledgeBaseConditionV1,
  KnowledgeBaseV1,
  RiskFactorV1,
  RiskOperatorV1,
  SimpleConditionV1
} from "../knowledgeBase/types";

interface OperatorEvaluationInput {
  actualValue: unknown;
  condition: SimpleConditionV1;
}

const operatorEvaluation: Record<RiskOperatorV1, (input: OperatorEvaluationInput) => boolean> = {
  eq: ({ actualValue, condition }) => {
    if (condition.operator !== "eq" || typeof actualValue !== typeof condition.value) {
      return false;
    }

    return actualValue === condition.value;
  },
  gt: ({ actualValue, condition }) => {
    if (condition.operator !== "gt" || typeof actualValue !== "number") {
      return false;
    }

    return actualValue > condition.value;
  },
  gte: ({ actualValue, condition }) => {
    if (condition.operator !== "gte" || typeof actualValue !== "number") {
      return false;
    }

    return actualValue >= condition.value;
  },
  between: ({ actualValue, condition }) => {
    if (condition.operator !== "between" || typeof actualValue !== "number") {
      return false;
    }

    return actualValue >= condition.min && actualValue <= condition.max;
  },
  outside_range: ({ actualValue, condition }) => {
    if (condition.operator !== "outside_range" || typeof actualValue !== "number") {
      return false;
    }

    return actualValue < condition.min || actualValue > condition.max;
  }
};

type RiskConditionInput = RiskFactorV1 | KnowledgeBaseConditionV1;

export function evaluateRisk(
  factors: Record<string, unknown>,
  knowledgeBase: KnowledgeBaseV1
): RiskFactorV1[] {
  return knowledgeBase.factors.filter((riskFactor) => isRiskConditionTrue(factors, riskFactor));
}

function isRiskConditionTrue(
  factors: Record<string, unknown>,
  riskCondition: RiskConditionInput
): boolean {
  const condition = "condition" in riskCondition ? riskCondition.condition : riskCondition;

  if ("all" in condition) {
    return condition.all.every((subRiskCondition) =>
      isRiskConditionTrue(factors, subRiskCondition)
    );
  }

  if ("or" in condition) {
    return condition.or.some((subRiskCondition) => isRiskConditionTrue(factors, subRiskCondition));
  }

  return evaluateOperator(factors, condition);
}

function evaluateOperator(
  factors: Record<string, unknown>,
  riskCondition: SimpleConditionV1
): boolean {
  const predicate = (
    operatorEvaluation as Partial<Record<string, (input: OperatorEvaluationInput) => boolean>>
  )[riskCondition.operator];

  if (!predicate) {
    return false;
  }

  return predicate({
    actualValue: factors[riskCondition.field],
    condition: riskCondition
  });
}
