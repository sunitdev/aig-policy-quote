import { FormControl, FormGroup, Validators } from "@angular/forms";
import type { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

import type { UIInput } from "@policy-quote/api-contract";

export type PolicyQuoteFormValue = string | number | null;
export type PolicyQuoteFormControl = FormControl<PolicyQuoteFormValue>;
export type PolicyQuoteForm = FormGroup<Record<string, PolicyQuoteFormControl>>;

export function buildPolicyQuoteForm(uiInputs: UIInput[]): PolicyQuoteForm {
  const controls: Record<string, PolicyQuoteFormControl> = {};

  for (const input of uiInputs) {
    controls[input.id] = new FormControl<PolicyQuoteFormValue>(defaultValueForInput(input), {
      validators: validatorsForInput(input)
    });
  }

  return new FormGroup(controls);
}

function defaultValueForInput(input: UIInput): PolicyQuoteFormValue {
  if (input.type === "number") {
    return null;
  }

  return "";
}

function validatorsForInput(input: UIInput): ValidatorFn[] {
  const validators: ValidatorFn[] = [];

  if (input.required) {
    validators.push((control: AbstractControl<PolicyQuoteFormValue>) =>
      Validators.required(control)
    );
  }

  if (input.type === "number") {
    if (input.min !== undefined) {
      validators.push(Validators.min(input.min));
    }

    if (input.max !== undefined) {
      validators.push(Validators.max(input.max));
    }
  }

  if (input.type === "select") {
    validators.push(selectOptionValidator(input.options));
  }

  return validators;
}

function selectOptionValidator(options: readonly string[]): ValidatorFn {
  return (control: AbstractControl<PolicyQuoteFormValue>): ValidationErrors | null => {
    const value = control.value;

    if (value === "" || value === null) {
      return null;
    }

    if (typeof value === "string" && options.includes(value)) {
      return null;
    }

    return {
      selectOption: {
        actual: value,
        options: [...options]
      }
    };
  };
}
