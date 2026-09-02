import {
  quoteValidationErrorResponseSchema,
  type QuoteRequest,
  type QuoteValidationErrorResponse,
  type UIInput
} from "@policy-quote/api-contract";

export function validateQuoteRequest(
  request: QuoteRequest,
  uiInputs: readonly UIInput[]
): QuoteValidationErrorResponse | null {
  const errors: Record<string, string[]> = {};

  for (const input of uiInputs) {
    const value = request[input.id];

    if (isEmptyValue(value)) {
      if (input.required) {
        addError(errors, input.id, `${input.label} is required.`);
      }

      continue;
    }

    validateInputValue(errors, input, value);
  }

  if (Object.keys(errors).length === 0) {
    return null;
  }

  return quoteValidationErrorResponseSchema.parse({
    message: "Quote request contains validation errors.",
    errors
  });
}

function validateInputValue(
  errors: Record<string, string[]>,
  input: UIInput,
  value: unknown
): void {
  switch (input.type) {
    case "text":
      if (typeof value !== "string") {
        addError(errors, input.id, `${input.label} must be a string.`);
      }
      return;
    case "number":
      validateNumberInputValue(errors, input, value);
      return;
    case "select":
      if (typeof value !== "string" || !input.options.includes(value)) {
        addError(errors, input.id, `${input.label} must be one of: ${input.options.join(", ")}.`);
      }
      return;
  }
}

function validateNumberInputValue(
  errors: Record<string, string[]>,
  input: Extract<UIInput, { type: "number" }>,
  value: unknown
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addError(errors, input.id, `${input.label} must be a number.`);
    return;
  }

  if (input.min !== undefined && value < input.min) {
    addError(errors, input.id, `${input.label} must be at least ${String(input.min)}.`);
  }

  if (input.max !== undefined && value > input.max) {
    addError(errors, input.id, `${input.label} must be at most ${String(input.max)}.`);
  }
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === "string" && value.trim() === "")
  );
}

function addError(errors: Record<string, string[]>, fieldId: string, message: string): void {
  errors[fieldId] = [...(errors[fieldId] ?? []), message];
}
