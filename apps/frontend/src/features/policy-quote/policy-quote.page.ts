import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import type { OnInit } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import type { UIInput, UIInputsResponse } from "@policy-quote/api-contract";
import { finalize } from "rxjs";

import {
  ButtonComponent,
  NumberInputComponent,
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
    NumberInputComponent,
    ReactiveFormsModule,
    SelectInputComponent,
    TextInputComponent
  ],
  templateUrl: "./policy-quote.page.html",
  styleUrl: "./policy-quote.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyQuotePageComponent implements OnInit {
  protected readonly isMetadataLoading = signal(true);
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

  private loadQuoteUiInputs(): void {
    this.isMetadataLoading.set(true);
    this.errorMessage.set("");

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
}
