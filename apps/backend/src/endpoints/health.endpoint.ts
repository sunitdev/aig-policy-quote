import { healthResponseSchema, type HealthResponse } from "@policy-quote/api-contract";

export function getHealthEndpoint(): HealthResponse {
  return healthResponseSchema.parse({
    status: "ok"
  });
}
