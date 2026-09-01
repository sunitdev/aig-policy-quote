import "@angular/compiler";

import { HttpClient } from "@angular/common/http";
import { Injector } from "@angular/core";
import { describe, expect, it, jest } from "@jest/globals";
import type { Observable } from "rxjs";
import { of } from "rxjs";

import type { QuoteRequest, QuoteResponse, UIInputsResponse } from "@policy-quote/api-contract";

import { DEFAULT_API_BASE_URL, provideApiBaseUrl } from "../../core/api";

import { PolicyQuoteService } from "./policy-quote.service";

interface HttpClientMock {
  get: jest.MockedFunction<(url: string) => Observable<UIInputsResponse>>;
  post: jest.MockedFunction<(url: string, body: QuoteRequest) => Observable<QuoteResponse>>;
}

function configurePolicyQuoteService(baseUrl = DEFAULT_API_BASE_URL): {
  httpClient: HttpClientMock;
  service: PolicyQuoteService;
} {
  const httpClient: HttpClientMock = {
    get: jest.fn<(url: string) => Observable<UIInputsResponse>>(),
    post: jest.fn<(url: string, body: QuoteRequest) => Observable<QuoteResponse>>()
  };

  const injector = Injector.create({
    providers: [
      PolicyQuoteService,
      provideApiBaseUrl({ baseUrl }),
      {
        provide: HttpClient,
        useValue: httpClient
      }
    ]
  });

  return {
    httpClient,
    service: injector.get(PolicyQuoteService)
  };
}

describe("PolicyQuoteService", () => {
  it("gets quote UI inputs from the configured API base URL", () => {
    const { httpClient, service } = configurePolicyQuoteService();
    const uiInputs: UIInputsResponse = [
      {
        id: "propertyType",
        label: "Property Type",
        options: ["House", "Flat"],
        type: "select"
      }
    ];
    httpClient.get.mockReturnValue(of(uiInputs));

    const result = service.getQuoteUiInputs();

    expect(httpClient.get).toHaveBeenCalledWith("http://127.0.0.1:3000/policy/quote/ui-inputs");
    expect(result).toBeDefined();
  });

  it("posts the quote request to the configured API base URL", () => {
    const { httpClient, service } = configurePolicyQuoteService();
    const request: QuoteRequest = {
      age: 42,
      propertyType: "House",
      previousClaims: 0
    };
    const quoteResponse: QuoteResponse = {
      annualPremium: 360,
      monthlyPremium: 30,
      riskBand: "STANDARD",
      riskScore: 0,
      riskSummary: "STANDARD risk with score 0. No risk factors were applied.",
      coverageDetails: {
        basePremium: 300,
        coverage: 360,
        coverageLoadFactor: 1.2,
        riskMultiplier: 1
      },
      appliedFactors: []
    };
    httpClient.post.mockReturnValue(of(quoteResponse));

    const result = service.createQuote(request);

    expect(httpClient.post).toHaveBeenCalledWith("http://127.0.0.1:3000/policy/quote", request);
    expect(result).toBeDefined();
  });

  it("normalizes a trailing slash in the API base URL override", () => {
    const { httpClient, service } = configurePolicyQuoteService("http://127.0.0.1:3000/");
    httpClient.get.mockReturnValue(of([]));

    service.getQuoteUiInputs();

    expect(httpClient.get).toHaveBeenCalledWith("http://127.0.0.1:3000/policy/quote/ui-inputs");
  });
});
