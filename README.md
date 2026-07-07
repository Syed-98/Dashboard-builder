# Dashboard Builder POC

A composable dashboard builder with a widget registry pattern, built as a pnpm monorepo with shared Zod schemas, an Express mock data API, and a React frontend with Recharts widgets.

## Quick Start

### Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

### Local Development

**Prerequisites:** Node.js 18+, pnpm 8+

```bash
# Install dependencies
pnpm install

# Build shared package first
pnpm --filter @dashboard-builder/shared build

# Run backend and frontend in parallel
pnpm dev
```

- Frontend: http://localhost:5173 (proxies `/api` to backend)
- Backend: http://localhost:3001

### Run Tests

```bash
pnpm test
```

## Evaluation Criteria Mapping

### Abstraction: Shell vs. Widget Logic
The `DashboardShell` and `WidgetContainer` have zero imports of specific chart components. They rely entirely on the `WidgetRegistry` singleton. Widget implementations live in isolated folders under `/widgets/`.

### Data Handling & Transformation
Raw JSON is strictly validated against Zod schemas in the `shared` package. Transformers automatically handle business logic (e.g., chronological sorting for temporal data, Pearson correlation calculation for relational data) before the data reaches the UI layer.

### Resiliency & Fault Tolerance
- **Network/API**: The `/batch` endpoint uses `Promise.allSettled`. One widget failing to fetch does not block the other 3.
- **Schema Drift**: If the backend returns malformed JSON, the `dataTransformers` throw a caught `DataTransformationError`, triggering per-widget error states without crashing the shell.
- **Render Crashes**: Every widget is wrapped in a `WidgetErrorBoundary`. A Recharts rendering bug will show a retry UI, leaving the rest of the dashboard functional.
- **Persistence**: Zustand localStorage hydration is wrapped in `onRehydrateStorage` to gracefully reset if the user manually corrupts browser storage.

### Developer Experience (DX)
To add a 5th chart type, a developer does not touch the dashboard engine, layout logic, or state management. They define a Zod schema, write a React component, and call `WidgetRegistry.register()`. See [PIE_CHART_TEMPLATE.md](./packages/frontend/src/widgets/PIE_CHART_TEMPLATE.md) for the copy-paste guide.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Monorepo | pnpm workspaces                     |
| Shared   | TypeScript, Zod                     |
| Backend  | Node.js, Express, CORS              |
| Frontend | React 18, Vite, Zustand, Recharts   |
| Layout   | react-grid-layout                   |
| Testing  | Vitest                              |
| Docker   | Multi-stage builds, nginx proxy     |

## Widget Types

| Type         | Chart        | Data Structure                          |
|--------------|--------------|-----------------------------------------|
| categorical  | Bar Chart    | Key-value pairs with optional categories |
| temporal     | Time Series  | ISO-8601 timestamps with trend/bounds  |
| hierarchical | Treemap      | Nested tree with depth calculation       |
| relational   | Scatter Plot | X/Y coordinates with Pearson correlation |

## Adding a New Widget

1. **Define data schema** in `packages/shared/src/schemas.ts`
2. **Create transformer** in `packages/shared/src/data-transformers.ts` with `validate()`, `transform()`, `toChartFormat()`
3. **Add mock generator** in `packages/backend/src/mock-engine.ts`
4. **Create widget folder** under `packages/frontend/src/widgets/{type}/`:
   - `config.ts` — widget-specific constants
   - `{Type}Widget.tsx` — Recharts component with loading/error/empty states
   - `index.ts` — exports `WidgetDefinition`
5. **Register** in `packages/frontend/src/widgets/index.ts`:

```typescript
import { myWidgetDefinition } from './my-type';
WidgetRegistry.register(myWidgetDefinition);
```

The dashboard shell discovers widgets automatically via `WidgetRegistry.getWidgetMetadata()` — no changes needed to `DashboardShell` or `WidgetContainer`.

## Project Structure

```
dashboard-builder/
├── packages/
│   ├── shared/          # Zod schemas, transformers, utils
│   ├── backend/         # Express API + MockDataEngine
│   └── frontend/        # React app + widget registry
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── docs/
    ├── ADR.md
    └── data-drift.md
```

## API Endpoints

| Method | Path                      | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/health`                 | Health check                   |
| POST   | `/api/widgets/data`       | Single widget data fetch       |
| POST   | `/api/widgets/data/batch` | Batch fetch (max 20 widgets)   |

## License

MIT
