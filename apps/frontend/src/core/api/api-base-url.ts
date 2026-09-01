import { InjectionToken, type ValueProvider } from "@angular/core";

export const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";

export const API_BASE_URL = new InjectionToken<string>("API_BASE_URL", {
  providedIn: "root",
  factory: () => normalizeApiBaseUrl(DEFAULT_API_BASE_URL)
});

export interface ApiBaseUrlProviderOptions {
  baseUrl?: string;
}

export function provideApiBaseUrl(options: ApiBaseUrlProviderOptions = {}): ValueProvider {
  return {
    provide: API_BASE_URL,
    useValue: normalizeApiBaseUrl(options.baseUrl ?? DEFAULT_API_BASE_URL)
  };
}

export function normalizeApiBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}
