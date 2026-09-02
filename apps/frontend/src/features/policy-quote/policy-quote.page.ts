import { CurrencyPipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import type { OnInit } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import type {
  QuoteRequest,
  QuoteResponse,
  QuoteValidationErrorResponse,
  UIInput,
  UIInputsResponse
} from "@policy-quote/api-contract";
import { finalize } from "rxjs";

import {
  ButtonComponent,
  NumberInputComponent,
  RiskBandBadgeComponent,
  SelectInputComponent,
  type AppSelectOption,
  TextInputComponent
} from "../../shared/ui";

import {
  buildPolicyQuoteForm,
  type PolicyQuoteForm,
  type PolicyQuoteFormControl
} from "./policy-quote.form";
import { PolicyQuoteService } from "./policy-quote.service";

@Component({
  selector: "app-policy-quote-page",
  standalone: true,
  imports: [
    ButtonComponent,
    CurrencyPipe,
    NumberInputComponent,
    ReactiveFormsModule,
    RiskBandBadgeComponent,
    SelectInputComponent,
    TextInputComponent
  ],
  templateUrl: "./policy-quote.page.html",
  styleUrl: "./policy-quote.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyQuotePageComponent implements OnInit {
  protected readonly isMetadataLoading = signal(true);
  protected readonly isQuoteSubmitting = signal(false);
  protected readonly quoteResult = signal<QuoteResponse | null>(null);
  protected readonly errorMessage = signal("");
  protected readonly uiInputs = signal<UIInputsResponse>([]);
  protected form: PolicyQuoteForm = buildPolicyQuoteForm([]);

  private readonly policyQuoteService = inject(PolicyQuoteService);

  public ngOnInit(): void {
    this.loadQuoteUiInputs();
  }

  protected controlFor(inputId: string): PolicyQuoteFormControl {
    return this.form.controls[inputId];
  }

  protected isRequired(input: UIInput): boolean {
    return input.required ?? false;
  }

  protected helpTextFor(input: UIInput): string {
    return input.description ?? "";
  }

  protected minFor(input: UIInput): number | null {
    return input.type === "number" ? (input.min ?? null) : null;
  }

  protected maxFor(input: UIInput): number | null {
    return input.type === "number" ? (input.max ?? null) : null;
  }

  protected selectOptionsFor(input: UIInput): AppSelectOption[] {
    if (input.type !== "select") {
      return [];
    }

    return input.options.map((option) => ({
      label: option,
      value: option
    }));
  }

  protected errorTextFor(input: UIInput): string {
    const control = this.controlFor(input.id);
    const backendErrors = control.getError("backend") as string[] | undefined;

    if (backendErrors && backendErrors.length > 0) {
      return backendErrors[0];
    }

    if (!control.touched || control.valid) {
      return "";
    }

    if (control.hasError("required")) {
      return `${input.label} is required.`;
    }

    if (control.hasError("min")) {
      const minError = control.getError("min") as { min: number };

      return `Minimum value is ${String(minError.min)}.`;
    }

    if (control.hasError("max")) {
      const maxError = control.getError("max") as { max: number };

      return `Maximum value is ${String(maxError.max)}.`;
    }

    if (control.hasError("selectOption")) {
      return "Choose one of the available options.";
    }

    return "Enter a valid value.";
  }

  protected isSubmitDisabled(): boolean {
    return this.form.invalid || this.isQuoteSubmitting();
  }

  protected submitQuote(): void {
    this.errorMessage.set("");
    this.clearBackendValidationErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.quoteResult.set(null);
    this.isQuoteSubmitting.set(true);

    this.policyQuoteService
      .createQuote(this.form.getRawValue() as QuoteRequest)
      .pipe(
        finalize(() => {
          this.isQuoteSubmitting.set(false);
        })
      )
      .subscribe({
        next: (quoteResult) => {
          this.quoteResult.set(quoteResult);
        },
        error: (error: unknown) => {
          this.handleQuoteSubmissionError(error);
        }
      });
  }

  private loadQuoteUiInputs(): void {
    this.isMetadataLoading.set(true);
    this.errorMessage.set("");
    this.quoteResult.set(null);

    this.policyQuoteService
      .getQuoteUiInputs()
      .pipe(
        finalize(() => {
          this.isMetadataLoading.set(false);
        })
      )
      .subscribe({
        next: (uiInputs) => {
          this.form = buildPolicyQuoteForm(uiInputs);
          this.uiInputs.set(uiInputs);
        },
        error: () => {
          this.form = buildPolicyQuoteForm([]);
          this.uiInputs.set([]);
          this.errorMessage.set("Unable to load the quote form. Please try again.");
        }
      });
  }

  private handleQuoteSubmissionError(error: unknown): void {
    const validationError = this.parseQuoteValidationError(error);

    if (validationError) {
      this.errorMessage.set(validationError.message);
      this.applyBackendValidationErrors(validationError.errors);
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set("Unable to prepare the quote. Please try again.");
  }

  private parseQuoteValidationError(error: unknown): QuoteValidationErrorResponse | null {
    if (!(error instanceof HttpErrorResponse) || !isQuoteValidationErrorResponse(error.error)) {
      return null;
    }

    return error.error;
  }

  private applyBackendValidationErrors(errors: Record<string, string[]>): void {
    for (const [fieldId, messages] of Object.entries(errors)) {
      const control = this.form.get(fieldId);

      if (!control) {
        continue;
      }

      control.setErrors({
        ...(control.errors ?? {}),
        backend: messages
      });
    }
  }

  private clearBackendValidationErrors(): void {
    for (const control of Object.values(this.form.controls)) {
      const errors = control.errors;

      if (!errors?.backend) {
        continue;
      }

      const nextErrors = {
        ...errors
      };
      delete nextErrors.backend;

      control.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
    }
  }
}

function isQuoteValidationErrorResponse(value: unknown): value is QuoteValidationErrorResponse {
  if (!isRecord(value) || typeof value.message !== "string" || !isRecord(value.errors)) {
    return false;
  }

  return Object.values(value.errors).every(isStringArray);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}
