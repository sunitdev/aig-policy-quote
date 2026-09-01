---
name: risk-kb-factor
description: Safely add or update risk factors in kb/risk-kb.json through a backup-first workflow without schema-breaking changes.
---

# Risk KB Factor

Use this skill when adding or updating risk factors for `kb/risk-kb.json`.

## Required Context

Before changing anything, read:

- `.agents/rules/kb-rules.md`
- `docs/kb.md`
- `kb/risk-kb.json`

If the change touches backend parser behavior or validation scripts, also read:

- `.agents/rules/backend-rules.md`
- `docs/backend.md`

## Backup-First Workflow

Do not edit `kb/risk-kb.json` directly when authoring a factor. Create or update `kb/risk-kb.json.backup` as the candidate file, using the active KB as the starting point when no current backup exists.

For ordinary factor-only requests, use this fast path:

1. Read the required context in parallel where possible.
2. Confirm the requested field, operator, bounds, select values, description, and points can be represented with the existing schema.
3. Refresh `kb/risk-kb.json.backup` from the active KB when there is no meaningful unpromoted backup candidate, then edit only the backup.
4. Run one promotion command after editing the backup:

```bash
pnpm kb:promote-risk-kb-backup
```

Use `pnpm kb:check-risk-kb-backup` only when you need validation without promotion, or when promotion fails and you need a narrower diagnostic. The promotion command runs through `tsx` and calls the same checker internally before copying, so a separate check before every promotion is redundant. The active `kb/risk-kb.json` is updated only after validation succeeds.

If a `pnpm kb:*` command fails before script output with a package-manager registry signature, verification, or `fetch failed` error, rerun the same command with network/escalated permission instead of retrying inside the restricted sandbox. This failure can happen during `pnpm` version bootstrap before the KB script starts.

## Factor Authoring Rules

- Keep `kbSchemaVersion` unchanged unless the user explicitly asks for a schema change and the backend parser is updated with it.
- Do not add new condition operators for ordinary factor requests. Use the operators already supported by the KB schema and risk engine: `eq`, `gt`, `gte`, `between`, and `outside_range`.
- Represent AND logic with `condition.all` and OR logic with `condition.or`.
- Keep business thresholds, select values, descriptions, and points in the KB data.
- Add a new `uiInputs` entry only when the requested factor needs a field that does not already exist.

## Ask Before Editing The Backup

Ask the user for missing or conflicting details before changing `kb/risk-kb.json.backup` when any required KB data cannot be derived safely:

- Factor `id`, plain-English `description`, `condition`, or numeric `points`.
- Unknown field IDs, unless the user has already supplied all required `uiInputs` details.
- Select values that are not in the field options. For example, `propertyType = "Falt"` must be confirmed because the current supported values are `House`, `Flat`, and `Bungalow`.
- Operators not supported by the schema or engine.
- Number bounds that cannot be represented with existing input constraints.

When the intent is clear and the KB already provides the needed constraints, translate into supported data instead of adding schema. For example, `age <= 25` can be represented with `between` using the current `age` minimum of `18` and `max` of `25`.

## Completion Check

A factor authoring task is complete only after:

- The backup contains the intended KB candidate.
- `pnpm kb:promote-risk-kb-backup` passes, including its built-in backup validation.
- The active `kb/risk-kb.json` was updated by the promotion script, not by direct manual editing.
- `pnpm kb:check-risk-kb-backup` passes only when the task is validation-only, the user asks for a separate check, or promotion needs diagnosis.
- Relevant Jest tests are run when parser, script, or risk behavior changes.
