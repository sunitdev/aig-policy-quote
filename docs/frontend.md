# Frontend Design

## Overview

The frontend is the browser application for entering policy quote details and reviewing quote results. It renders quote inputs from backend-provided KB metadata, manages local interaction state, submits quote requests, and presents explainable results.

The frontend package is `@policy-quote/frontend` under `apps/frontend`. This document stays at frontend-area level so the implementation can evolve without listing source files.

## Package Organization

```text
apps/frontend/
  config/                 # Angular, TypeScript, lint, and package configuration
  src/
    app shell/            # Application bootstrap, routing, and page shell
    core/
      api/                # API base URL and shared HTTP configuration
    shared/
      ui/                 # Reusable controls, form wrappers, alerts, and badges
    features/
      policy-quote/       # UI metadata loading, quote form, submit flow, and results
    tests/                # Frontend unit and component tests
```

The frontend is organized by responsibility:

- App bootstrap and shell provide the Angular entrypoint, routing, layout, and global providers.
- Core infrastructure contains app-wide concerns such as API base URL configuration.
- Shared UI components provide reusable controls and display primitives.
- The policy quote feature owns the quote form, submit flow, API integration, and result presentation.
- Tests cover form behavior, API states, and rendering of quote results.

## Technology Choices

The frontend uses:

- Angular standalone components for simpler component wiring.
- Reactive Forms for quote input state and validation.
- Angular Signals for page-level UI state.
- HttpClient and RxJS for backend communication.
- Custom CSS for the UI system.

External UI component libraries are not part of the frontend architecture. The app should build its own small shared UI layer for the controls it needs.

## UI Metadata Flow

The quote form is driven by `uiInputs` from `kb/risk-kb.json`, exposed through the backend UI metadata endpoint.

High-level flow:

1. The frontend calls `GET /policy/quote/ui-inputs`.
2. The backend returns field definitions from `uiInputs`.
3. The quote feature maps each input definition to a form control.
4. Angular renders the form from those controls.
5. Client-side validators are derived from metadata such as `required`, `min`, `max`, and `options`.

The frontend should not hardcode the list of quote fields when those fields are available from the UI metadata response.

## Quote Submission Flow

After the form is rendered and completed:

1. Reactive Forms validate the input locally.
2. The quote feature builds a request using the shared API contract.
3. The frontend submits the request to `POST /policy/quote`.
4. The backend calculates risk and premium values.
5. The frontend renders the returned quote result.

The frontend does not calculate risk scores, risk bands, premiums, or applied factors locally.

## State Responsibilities

Reactive Forms own field-level form state:

- current field values
- touched and dirty state
- validation status
- field-level error messages

Signals own page-level interaction state:

- loading UI metadata
- loading quote results
- quote result
- error message
- empty or retry states

This keeps form validation separate from page interaction flow.

## Shared UI Responsibilities

Shared UI components are presentation primitives. They should be reusable, accessible, and free from policy quote scoring logic.

The shared UI layer should provide:

- button components for actions and loading states
- form field wrappers for labels, help text, and validation messages
- text and number inputs for metadata-driven fields
- select controls for metadata-defined options
- alert components for validation and API errors
- risk band badges for displaying backend-provided risk bands

Shared UI components should receive data through inputs and emit user interactions. They should not call APIs, inspect the KB, or decide scoring behavior.

## Policy Quote Feature

The policy quote feature owns the end-to-end frontend quote workflow through a small set of single-purpose files:

- `policy-quote.page.ts` coordinates UI metadata loading, form state, submit handling, and quote result state.
- `policy-quote.page.html` renders the quote form, loading and error states, and the returned quote result.
- `policy-quote.page.css` styles only the policy quote page layout and result presentation.
- `policy-quote.form.ts` builds Reactive Form controls and validators from `uiInputs`.
- `policy-quote.service.ts` calls the UI metadata and quote APIs using shared contract types.
- `policy-quote.vm.ts` formats backend response values for display without changing quote calculations.

The feature may coordinate multiple shared UI components, but reusable visual behavior should remain in the shared UI layer.

## API And Contract Boundary

The frontend should use `@policy-quote/api-contract` for shared schemas and TypeScript types:

- UI metadata response
- quote request
- quote response
- risk band identifiers
- applied factor shape

The shared contract keeps frontend API calls aligned with backend validation. It does not move business authority into the frontend.

## Styling Responsibilities

The frontend uses custom CSS:

- global styling defines typography, base layout, colors, spacing, surfaces, and focus states
- shared UI styling defines reusable component appearance
- feature styling defines quote-page layout and result presentation

Styles should keep quote entry and quote results easy to scan. Page-specific layout should stay in the policy quote feature, while reusable component styling should stay with shared UI components.

## Testing Responsibilities

Frontend tests should cover:

- UI metadata fetch and form rendering
- validation from `uiInputs`
- successful quote submission
- loading state while metadata or quote requests are in flight
- API error rendering
- result rendering for monthly and annual premiums
- risk band badge display for backend-provided risk bands
- applied factors rendered exactly from the API response
