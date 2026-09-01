# Knowledge Base Design

## Overview

`kb/risk-kb.json` is the source of truth for policy quote inputs, rating settings, risk bands, and risk factors. Business scoring data belongs in the KB; application code supplies the generic engine that validates and evaluates the data.

When a rule uses an existing UI input field and an existing generic operator, adding or changing that rule should only require editing `kb/risk-kb.json`.

## Application Code Boundary

Application code may define:

- KB loading
- KB schema validation
- UI input rendering from `uiInputs`
- generic condition operators
- compound condition evaluation
- factor compilation
- point application
- risk-band resolution
- premium calculation

Application code should not hardcode specific business rules such as property type, age range, claims thresholds, property value thresholds, or point values.

## `risk-kb.json` Structure

The KB has this top-level structure:

```json
{
  "kbSchemaVersion": "1.0.0",
  "version": "1.0.0",
  "basePremium": 300,
  "coverageLoadFactor": 1.2,
  "riskBands": {
    "STANDARD": {
      "min": 0,
      "max": 25,
      "riskMultiplier": 1
    },
    "ELEVATED": {
      "min": 26,
      "max": 60,
      "riskMultiplier": 1.5
    },
    "HIGH_RISK": {
      "min": 61,
      "max": 999,
      "riskMultiplier": 2.2
    }
  },
  "uiInputs": [],
  "factors": []
}
```

Top-level fields:

- `kbSchemaVersion`: version of the JSON schema shape used by the app.
- `version`: business version of the active KB content.
- `basePremium`: base annual premium used by the premium calculator.
- `coverageLoadFactor`: multiplier applied during premium calculation.
- `riskBands`: score ranges and premium multipliers used to classify quote risk.
- `uiInputs`: field definitions used to render and validate quote inputs.
- `factors`: risk factor rows evaluated by the risk engine.

## UI Input Structure

`uiInputs` defines the customer and property fields that the quote form can render.

Example:

```json
{
  "id": "propertyType",
  "type": "select",
  "label": "Type of property",
  "options": ["House", "Flat", "Bungalow"]
}
```

Input fields:

- `id`: field identifier used by frontend form state and risk factor conditions.
- `type`: control type, currently `text`, `number`, or `select`.
- `label`: user-facing field label.
- `description`: optional help text for the user.
- `required`: optional flag indicating a mandatory value.
- `min`: optional numeric lower bound.
- `max`: optional numeric upper bound.
- `options`: allowed values for `select` inputs.

Current inputs:

- `customerName`: text input for the policyholder's full name.
- `age`: required number input from 18 to 100.
- `previousClaims`: number input from 0 to 10.
- `propertyType`: select input with `House`, `Flat`, and `Bungalow`.
- `propertyValue`: number input from 50000 to 2000000.

The frontend should render controls from `uiInputs` where possible. The backend remains authoritative for validation and quote calculation.

## Factor Structure

Each factor describes a risk rule and the score contribution when its condition matches.

Simple factor example:

```json
{
  "id": "property_type_flat",
  "description": "Flat - higher shared risk",
  "condition": {
    "field": "propertyType",
    "operator": "eq",
    "value": "Flat"
  },
  "points": 10
}
```

Factor fields:

- `id`: stable machine-readable identifier.
- `description`: plain-English explanation for quote results.
- `condition`: simple or compound condition to evaluate.
- `points`: score contribution when the factor matches.
- `perOccurrence`: optional flag for occurrence-based point multiplication.

Simple condition fields:

- `field`: quote input field to inspect.
- `operator`: generic operator used for comparison.
- `value`: comparison value for operators that need one.
- `min`: lower bound for range operators.
- `max`: upper bound for range operators.

## Compound Conditions

The KB supports compound conditions with `condition.all` and `condition.or`.

AND example:

```json
{
  "id": "flat_and_property_value_high",
  "description": "Flat and property value over GBP 500,000",
  "condition": {
    "all": [
      {
        "field": "propertyType",
        "operator": "eq",
        "value": "Flat"
      },
      {
        "field": "propertyValue",
        "operator": "gt",
        "value": 500000
      }
    ]
  },
  "points": 35
}
```

`all` means every nested condition must match before the factor contributes points.

OR example:

```json
{
  "id": "house_or_bungalow_property",
  "description": "House or bungalow property",
  "condition": {
    "or": [
      {
        "field": "propertyType",
        "operator": "eq",
        "value": "House"
      },
      {
        "field": "propertyType",
        "operator": "eq",
        "value": "Bungalow"
      }
    ]
  },
  "points": 5
}
```

`or` means at least one nested condition must match before the factor contributes points. Compound conditions should be represented as data, not as hardcoded branching in the risk engine.

## Risk Bands

The KB defines these score bands and premium multipliers:

- `STANDARD`: 0 to 25, multiplier `1`
- `ELEVATED`: 26 to 60, multiplier `1.5`
- `HIGH_RISK`: 61 to 999, multiplier `2`

The backend should resolve risk bands from the KB thresholds.

## Current Factors

The KB includes these policy quote factors:

- `age_young_elderly`: age outside 25 to 75 adds 20 points.
- `previous_claims_low`: 1 to 2 previous claims adds 15 points per occurrence.
- `previous_claims_high`: 3 or more previous claims adds 30 points per occurrence.
- `property_type_flat`: property type equal to `Flat` adds 10 points.
- `property_value_high`: property value over 750000 adds 25 points.
- `flat_and_property_value_high`: property type equal to `Flat` and property value over 500000 adds 35 points.

## Operators

Operators used by the current KB:

- `eq`: actual value equals the configured value.
- `gt`: numeric actual value is greater than the configured value.
- `gte`: numeric actual value is greater than or equal to the configured value.
- `between`: numeric actual value is between `min` and `max`, inclusive.
- `outside_range`: numeric actual value is lower than `min` or higher than `max`.

An operator should be used in the KB only when backend validation and the risk engine support it.

## Premium Data

The current KB provides:

- `basePremium`
- `coverageLoadFactor`
- risk-band premium multipliers

The premium calculator should read these values from the KB. Risk bands define both score ranges and the multiplier used by the premium formula.

Premium formula:

```text
basePremium x riskMultiplier x coverageLoadFactor
```

## Example Rule Changes

New simple factor using an existing input:

```json
{
  "id": "property_value_very_high",
  "description": "Property value over GBP 1,000,000",
  "condition": {
    "field": "propertyValue",
    "operator": "gt",
    "value": 1000000
  },
  "points": 40
}
```

New compound factor:

```json
{
  "id": "flat_and_many_claims",
  "description": "Flat with 3 or more previous claims",
  "condition": {
    "all": [
      {
        "field": "propertyType",
        "operator": "eq",
        "value": "Flat"
      },
      {
        "field": "previousClaims",
        "operator": "gte",
        "value": 3
      }
    ]
  },
  "points": 45
}
```

Nested compound factor for `(X and B) or (B and C)`:

```json
{
  "id": "high_value_flat_or_high_value_claims",
  "description": "High-value flat or high-value property with 3 or more previous claims",
  "condition": {
    "or": [
      {
        "all": [
          {
            "field": "propertyType",
            "operator": "eq",
            "value": "Flat"
          },
          {
            "field": "propertyValue",
            "operator": "gt",
            "value": 500000
          }
        ]
      },
      {
        "all": [
          {
            "field": "propertyValue",
            "operator": "gt",
            "value": 500000
          },
          {
            "field": "previousClaims",
            "operator": "gte",
            "value": 3
          }
        ]
      }
    ]
  },
  "points": 55
}
```

In this example, `X` is property type `Flat`, `B` is property value over GBP 500,000, and `C` is 3 or more previous claims.

New input plus factor:

```json
{
  "id": "roofType",
  "type": "select",
  "label": "Roof type",
  "required": true,
  "options": ["Slate", "Tile", "Thatch"]
}
```

```json
{
  "id": "thatch_roof",
  "description": "Thatch roof - higher fire risk",
  "condition": {
    "field": "roofType",
    "operator": "eq",
    "value": "Thatch"
  },
  "points": 30
}
```

If a new factor uses an existing input field, add only the factor. If it needs a new customer input, add the input definition to `uiInputs` and then reference it from the factor.

## Rule Change Guidance

When changing risk rules:

- keep factor IDs stable and descriptive
- use plain-English descriptions
- keep thresholds and points in the KB
- do not change the KB schema when adding a new rule
- add generic operators only when needed
- validate the KB before serving quote requests
- test each risk band and applied factor behavior
- prove KB-only factor changes affect scoring without engine changes
- schema can only be change by updating the kbSchemaVersion field
