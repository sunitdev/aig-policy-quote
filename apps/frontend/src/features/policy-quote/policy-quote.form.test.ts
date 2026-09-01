import "@angular/compiler";

import { describe, expect, it } from "@jest/globals";

import type { UIInput } from "@policy-quote/api-contract";

import { buildPolicyQuoteForm } from "./policy-quote.form";

describe("buildPolicyQuoteForm", () => {
  it("uses sensible default values for each input type", () => {
    const form = buildPolicyQuoteForm([
      {
        id: "policyholderName",
        label: "Policyholder Name",
        type: "text"
      },
      {
        id: "coverageAmount",
        label: "Coverage Amount",
        type: "number"
      },
      {
        id: "propertyKind",
        label: "Property Kind",
        options: ["House", "Flat"],
        type: "select"
      }
    ]);

    expect(form.getRawValue()).toEqual({
      coverageAmount: null,
      policyholderName: "",
      propertyKind: ""
    });
  });

  it("derives required validators from required metadata", () => {
    const form = buildPolicyQuoteForm([
      {
        id: "name",
        label: "Name",
        required: true,
        type: "text"
      },
      {
        id: "age",
        label: "Age",
        required: true,
        type: "number"
      },
      {
        id: "propertyType",
        label: "Property Type",
        options: ["House", "Flat"],
        required: true,
        type: "select"
      }
    ]);

    expect(form.controls.name.errors).toEqual({ required: true });
    expect(form.controls.age.errors).toEqual({ required: true });
    expect(form.controls.propertyType.errors).toEqual({ required: true });

    form.controls.name.setValue("Ada Lovelace");
    form.controls.age.setValue(42);
    form.controls.propertyType.setValue("House");

    expect(form.valid).toBe(true);
  });

  it("derives number min and max validators from metadata", () => {
    const form = buildPolicyQuoteForm([
      {
        id: "riskCount",
        label: "Risk Count",
        max: 10,
        min: 2,
        type: "number"
      }
    ]);
    const control = form.controls.riskCount;

    control.setValue(1);
    expect(control.errors).toMatchObject({
      min: {
        actual: 1,
        min: 2
      }
    });

    control.setValue(11);
    expect(control.errors).toMatchObject({
      max: {
        actual: 11,
        max: 10
      }
    });

    control.setValue(2);
    expect(control.valid).toBe(true);

    control.setValue(10);
    expect(control.valid).toBe(true);
  });

  it("validates select values against metadata options", () => {
    const form = buildPolicyQuoteForm([
      {
        id: "roofType",
        label: "Roof Type",
        options: ["Tile", "Slate"],
        type: "select"
      }
    ]);
    const control = form.controls.roofType;

    expect(control.value).toBe("");
    expect(control.valid).toBe(true);

    control.setValue("Tile");
    expect(control.valid).toBe(true);

    control.setValue("Metal");
    expect(control.errors).toEqual({
      selectOption: {
        actual: "Metal",
        options: ["Tile", "Slate"]
      }
    });
  });

  it("builds a valid form when all metadata-derived validators pass", () => {
    const form = buildPolicyQuoteForm([
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
    ]);

    form.setValue({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });

    expect(form.valid).toBe(true);
    expect(form.getRawValue()).toEqual({
      assetValue: 250000,
      constructionStyle: "Terraced",
      customerAlias: "Quote A"
    });
  });

  it("uses arbitrary UI input IDs instead of hardcoded policy quote field names", () => {
    const uiInputs: UIInput[] = [
      {
        id: "bespokeTextSignal",
        label: "Bespoke Text Signal",
        type: "text"
      },
      {
        id: "bespokeSelectSignal",
        label: "Bespoke Select Signal",
        options: ["Alpha", "Beta"],
        type: "select"
      }
    ];

    const form = buildPolicyQuoteForm(uiInputs);

    expect(Object.keys(form.controls)).toEqual(["bespokeTextSignal", "bespokeSelectSignal"]);
    expect(form.get("age")).toBeNull();
    expect(form.get("propertyType")).toBeNull();
  });
});
