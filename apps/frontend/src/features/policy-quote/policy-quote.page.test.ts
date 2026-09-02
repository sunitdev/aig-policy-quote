import "@angular/compiler";

import { Injector, runInInjectionContext } from "@angular/core";
import type { WritableSignal } from "@angular/core";
import { describe, expect, it, jest } from "@jest/globals";
import type { Observable } from "rxjs";
import { of, Subject, throwError } from "rxjs";

import type {
  QuoteRequest,
  QuoteResponse,
  UIInput,
  UIInputsResponse
} from "@policy-quote/api-contract";

import type { PolicyQuoteForm } from "./policy-quote.form";
import { PolicyQuotePageComponent } from "./policy-quote.page";
import { PolicyQuoteService } from "./policy-quote.service";

interface PolicyQuoteServiceMock {
  getQuoteUiInputs: jest.MockedFunction<() => Observable<UIInputsResponse>>;
  createQuote: jest.MockedFunction<(request: QuoteRequest) => Observable<QuoteResponse>>;
}

type PolicyQuotePageHarness = PolicyQuotePageComponent & {
  errorMessage: WritableSignal<string>;
  form: PolicyQuoteForm;
  isQuoteSubmitting: WritableSignal<boolean>;
  quoteResult: WritableSignal<QuoteResponse | null>;
  errorTextFor(input: UIInput): string;
  isSubmitDisabled(): boolean;
  submitQuote(): void;
};

const uiInputs: UIInputsResponse = [
  {
    id: "customerAlias",
    label: "Customer Alias",
    required: true,
    type: "text"
  },
  {
    id: "assetValue",
    label: "Asset Value",
    max: 500000,
    min: 100000,
    required: true,
    type: "number"
  },
  {
    id: "constructionStyle",
    label: "Construction Style",
    options: ["Detached", "Terraced"],
    required: true,
    type: "select"
  }
];

const quoteResponse: QuoteResponse = {
  annualPremium: 540,
  monthlyPremium: 45,
  riskBand: "ELEVATED",
  riskScore: 35,
  riskSummary: "ELEVATED risk with score 35. Applied risk factors: Example factor.",
  coverageDetails: {
    basePremium: 300,
    coverage: 540,
    coverageLoadFactor: 1.2,
    riskMultiplier: 1.5
  },
  appliedFactors: [
    {
      contribution: 35,
      description: "Example factor",
      id: "example_factor",
      perOccurrence: false,
      points: 35
    }
  ]
};

function setupComponent(
  options: {
    createQuoteResult?: Observable<QuoteResponse>;
    uiInputResult?: Observable<UIInputsResponse>;
  } = {}
): {
  component: PolicyQuotePageHarness;
  service: PolicyQuoteServiceMock;
} {
  const service: PolicyQuoteServiceMock = {
    createQuote: jest.fn<(request: QuoteRequest) => Observable<QuoteResponse>>(),
    getQuoteUiInputs: jest.fn<() => Observable<UIInputsResponse>>()
  };

  service.getQuoteUiInputs.mockReturnValue(options.uiInputResult ?? of(uiInputs));
  service.createQuote.mockReturnValue(options.createQuoteResult ?? of(quoteResponse));

  const injector = Injector.create({
    providers: [
      {
        provide: PolicyQuoteService,
        useValue: service
      }
    ]
  });
  const component = runInInjectionContext(
    injector,
    () => new PolicyQuotePageComponent()
  ) as PolicyQuotePageHarness;

  component.ngOnInit();

  return {
    component,
    service
  };
}

describe("PolicyQuotePageComponent", () => {
  it("disables submit while the form is invalid or quote submission is loading", () => {
    const createQuoteResult = new Subject<QuoteResponse>();
    const { component } = setupComponent({ createQuoteResult });

    expect(component.isSubmitDisabled()).toBe(true);

    component.form.setValue({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });

    expect(component.isSubmitDisabled()).toBe(false);

    component.submitQuote();

    expect(component.isSubmitDisabled()).toBe(true);

    createQuoteResult.next(quoteResponse);
    createQuoteResult.complete();

    expect(component.isSubmitDisabled()).toBe(false);
  });

  it("marks controls as touched and does not submit when the form is invalid", () => {
    const { component, service } = setupComponent();

    expect(component.form.controls.customerAlias.touched).toBe(false);

    component.submitQuote();

    expect(component.form.controls.customerAlias.touched).toBe(true);
    expect(component.form.controls.assetValue.touched).toBe(true);
    expect(component.form.controls.constructionStyle.touched).toBe(true);
    expect(component.errorTextFor(uiInputs[0])).toBe("Customer Alias is required.");
    expect(service.createQuote).not.toHaveBeenCalled();
  });

  it("submits the metadata-generated form value as the quote request", () => {
    const { component, service } = setupComponent();

    component.form.setValue({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });
    component.submitQuote();

    expect(service.createQuote).toHaveBeenCalledWith({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });
  });

  it("stores a successful quote response and clears the loading state", () => {
    const createQuoteResult = new Subject<QuoteResponse>();
    const { component } = setupComponent({ createQuoteResult });

    component.form.setValue({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });
    component.submitQuote();

    expect(component.isQuoteSubmitting()).toBe(true);
    expect(component.quoteResult()).toBeNull();

    createQuoteResult.next(quoteResponse);
    createQuoteResult.complete();

    expect(component.quoteResult()).toEqual(quoteResponse);
    expect(component.isQuoteSubmitting()).toBe(false);
  });

  it("sets an error message and clears loading when quote submission fails", () => {
    const { component } = setupComponent({
      createQuoteResult: throwError(() => new Error("Quote API unavailable"))
    });

    component.form.setValue({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });
    component.submitQuote();

    expect(component.errorMessage()).toBe("Unable to prepare the quote. Please try again.");
    expect(component.isQuoteSubmitting()).toBe(false);
    expect(component.quoteResult()).toBeNull();
  });
});
