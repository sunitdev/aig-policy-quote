import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@jest/globals";

describe("PolicyQuoteInfraStack", () => {
  it("declares the GET /policy/quote/ui-inputs Lambda route", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const appSource = readFileSync(join(currentDir, "app.ts"), "utf8");

    expect(appSource).toContain('"QuoteUiInputsFunction"');
    expect(appSource).toContain('"quote-ui-inputs.ts"');
    expect(appSource).toContain('addResource("policy")');
    expect(appSource).toContain('addResource("quote")');
    expect(appSource).toContain('addResource("ui-inputs")');
    expect(appSource).toContain('addMethod("GET"');
  });

  it("declares the POST /policy/quote Lambda route", () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const appSource = readFileSync(join(currentDir, "app.ts"), "utf8");

    expect(appSource).toContain('"CreateQuoteFunction"');
    expect(appSource).toContain('"create-quote.ts"');
    expect(appSource).toContain('addResource("policy")');
    expect(appSource).toContain('addResource("quote")');
    expect(appSource).toContain('addMethod("POST"');
  });
});
