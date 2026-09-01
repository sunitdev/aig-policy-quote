import { provideHttpClient } from "@angular/common/http";
import type { ApplicationConfig } from "@angular/core";

import { provideApiBaseUrl } from "./core/api";

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(), provideApiBaseUrl()]
};
