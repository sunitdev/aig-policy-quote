# Frontend Rules

Before frontend changes, read and follow `docs/frontend.md`.

Agent guardrails:

- Render quote form controls from backend-provided `uiInputs` instead of hardcoding the field list.
- Do not calculate risk scores, risk bands, premiums, or applied factors in the frontend.
- Keep shared UI components presentation-only; API calls and policy quote workflow belong in the policy quote feature.
- Use `@policy-quote/api-contract` for shared API types and schemas.
- Do not add external UI component libraries unless explicitly requested.
