# Adding a 5th Widget (e.g., Pie Chart)

Total time: ~5 minutes. Zero engine changes required.

### 1. Shared: Define the Schema

Add to `packages/shared/src/schemas.ts`:

```typescript
export const proportionPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
});

export const proportionDataSchema = z.object({
  slices: z.array(proportionPointSchema).min(1),
  total: z.number(),
});

export type ProportionData = z.infer<typeof proportionDataSchema>;
```

Add `'proportion'` to `WIDGET_TYPES` in `packages/shared/src/types.ts`, then add a transformer in `packages/shared/src/data-transformers.ts` with `validate()`, `transform()`, and `toChartFormat()`.

### 2. Backend: Add the Generator

Add a case to `MockDataEngine.generate()` in `packages/backend/src/mock-engine.ts`:

```typescript
case 'proportion':
  return this.generateProportion();

// ...

private generateProportion() {
  const labels = ['Segment A', 'Segment B', 'Segment C', 'Segment D'];
  const slices = labels.map((label) => ({
    label,
    value: Math.round(this.rng.nextFloat(10, 40)),
    color: undefined,
  }));
  return {
    slices,
    total: slices.reduce((sum, s) => sum + s.value, 0),
  };
}
```

### 3. Frontend: Create the Widget

Create `packages/frontend/src/widgets/proportion/`:

- `config.ts` — chart colors and defaults
- `ProportionWidget.tsx` — Recharts `PieChart` with loading/error/empty states
- `index.ts` — exports `WidgetDefinition`:

```typescript
import type { ComponentType } from 'react';
import type { WidgetDefinition, WidgetProps } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { ProportionWidget } from './ProportionWidget';

export const proportionWidgetDefinition: WidgetDefinition = {
  type: 'proportion',
  displayName: 'Pie Chart',
  defaultConfig: { title: 'Pie Chart' },
  defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
  component: ProportionWidget as ComponentType<WidgetProps<unknown>>,
  dataTransformer: dataTransformers.proportion.transform,
  validateData: dataTransformers.proportion.validate,
};
```

### 4. Register It

Add ONE line to `packages/frontend/src/widgets/index.ts`:

```typescript
import { proportionWidgetDefinition } from './proportion';
WidgetRegistry.register(proportionWidgetDefinition);
```

Done. The toolbar, grid, and data pipelines will automatically handle it.
