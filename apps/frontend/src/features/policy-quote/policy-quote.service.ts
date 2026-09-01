import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";

import type { QuoteRequest, QuoteResponse, UIInputsResponse } from "@policy-quote/api-contract";

import { API_BASE_URL } from "../../core/api";

@Injectable({
  providedIn: "root"
})
export class PolicyQuoteService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getQuoteUiInputs(): Observable<UIInputsResponse> {
    return this.http.get<UIInputsResponse>(this.apiUrl("/policy/quote/ui-inputs"));
  }

  createQuote(request: QuoteRequest): Observable<QuoteResponse> {
    return this.http.post<QuoteResponse>(this.apiUrl("/policy/quote"), request);
  }

  private apiUrl(path: string): string {
    return `${this.apiBaseUrl}${path}`;
  }
}
