# Data Drift: Detection, Response, and Prevention

## Overview

Data drift occurs when the shape, distribution, or semantics of data served to dashboard widgets diverges from what transformers and schemas expect. In a dashboard builder with multiple widget types and external data sources, drift can cause silent rendering failures, misleading visualizations, or complete widget crashes.

## Detection

### Schema Validation (First Line of Defense)

Every data payload passes through Zod schemas in the shared package before reaching widget components:

```typescript
const result = categoricalDataSchema.safeParse(raw);
if (!result.success) {
  throw new DataTransformationError('Invalid categorical data', result.error);
}
```

This catches structural drift immediately: missing fields, wrong types, invalid formats (e.g., non-ISO timestamps).

### Statistical Monitoring (Second Line)

For temporal and relational data, transformers compute derived metrics (trend direction, Pearson correlation). Monitoring these over time can detect distribution drift:

- **Temporal:** Alert if `trendPercentage` swings beyond historical bounds (e.g., >50% change between refreshes).
- **Relational:** Alert if correlation coefficient shifts significantly (e.g., from 0.85 to 0.2), indicating the underlying relationship changed.
- **Hierarchical:** Alert if `totalValue` or `depth` changes unexpectedly between fetches.

### Runtime Error Tracking

`WidgetErrorBoundary` catches render-time failures. `useWidgetData` distinguishes `DataTransformationError` (schema/logic failure) from network errors, enabling targeted alerting.

## Response

### Graceful Degradation

When drift is detected but data is partially valid:

1. **Stale data retention** — If a fetch fails validation, keep the last known good data in the widget state rather than clearing it. The `setWidgetError` action sets the error flag but does not null out `data`.
2. **Error state display** — Widgets show a red error banner with the specific validation message, while optionally still rendering stale chart data underneath.
3. **Adaptive transformers** — Schemas use optional fields (`upperBound?`, `category?`) so minor schema evolution doesn't break existing widgets. Transformers apply defaults for missing optional fields.

### Alerting Pipeline

```
Data Fetch → Zod Validate → Transform → Render
                  │ fail              │ crash
                  ▼                   ▼
            setWidgetError()    WidgetErrorBoundary
                  │                   │
                  └──── onError() ────┘
                           │
                    Alerting Service
                    (log, metrics, notify)
```

In production, `onError` callbacks and transformation failures would feed into an observability stack (e.g., Sentry, Datadog) with widget type, dashboard ID, and the specific validation errors attached.

## Prevention

### Schema Versioning

Add a `schemaVersion` field to API responses:

```typescript
{
  schemaVersion: '1.0',
  data: { ... }
}
```

Transformers can branch on version to handle multiple schema shapes during migration periods.

### Contract Testing

- **Shared package tests** (`data-transformers.test.ts`) validate that transformers accept known-good fixtures and reject known-bad inputs.
- **Backend tests** (`mock-engine.test.ts`) verify generators produce data that passes Zod schemas.
- **CI pipeline** runs both test suites on every PR, catching drift between generator output and schema expectations before deployment.

### API Contract Documentation

Maintain an OpenAPI spec or typed contract file that both backend and frontend reference. The shared Zod schemas serve as the single source of truth — backend validates outgoing data, frontend validates incoming data, and tests verify both sides agree.

## Summary

| Strategy     | When                          | Mechanism                                    |
|--------------|-------------------------------|----------------------------------------------|
| Detection    | Every data fetch              | Zod safeParse + statistical bounds           |
| Response     | Validation/render failure     | Stale data + error banner + error boundary   |
| Prevention   | Development + CI              | Schema versioning + contract tests           |
