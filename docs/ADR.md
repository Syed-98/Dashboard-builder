# Architecture Decision Records

## ADR-001: State Management with Zustand

**Status:** Accepted

**Context:** The dashboard needs client-side state for widget configurations, grid layouts, widget data/loading states, and UI mode (edit/locked). We evaluated Redux Toolkit and Zustand.

**Decision:** Use Zustand with the `persist` middleware.

**Rationale:**
- **Simpler API** — No actions, reducers, or boilerplate. Store is defined in a single file with direct state mutations via `set()`.
- **Selective subscriptions** — Components subscribe to specific slices (`useDashboardStore(s => s.widgetConfigs)`), avoiding unnecessary re-renders.
- **Built-in persist** — `persist` middleware with `partialize` lets us save only configs and layouts to localStorage, excluding volatile widget data.
- **Smaller bundle** — ~1KB gzipped vs ~12KB for Redux Toolkit.

**Consequences:**
- No time-travel debugging (acceptable for a POC).
- Middleware ecosystem is smaller than Redux, but sufficient for our needs.

---

## ADR-002: Charting Library — Recharts

**Status:** Accepted

**Context:** Four widget types require distinct chart visualizations: bar, time series, treemap, and scatter. We evaluated Recharts, Nivo, and Victory.

**Decision:** Use Recharts.

**Rationale:**
- **Composable React API** — Charts are built from declarative JSX components (`<BarChart>`, `<Line>`, `<Scatter>`), matching our component-based architecture.
- **All required chart types** — BarChart, ComposedChart (line + area), Treemap, and ScatterChart are all first-class citizens.
- **Easy customization** — Custom content components (treemap cells), conditional rendering (regression lines), and responsive containers work out of the box.
- **Active maintenance** — Large community, regular updates, good TypeScript support.

**Consequences:**
- Bundle size is moderate (~150KB). Acceptable for a dashboard app.
- Highly customized visualizations may require SVG-level workarounds.

---

## ADR-003: Widget Registry Pattern

**Status:** Accepted

**Context:** The dashboard shell must render arbitrary widget types without knowing their implementation details. New widgets should be addable without modifying shell code.

**Decision:** Implement a singleton `WidgetRegistry` that maps `WidgetType` to `WidgetDefinition` objects containing the component, data transformer, validator, and metadata.

**Rationale:**
- **Open/Closed Principle** — Shell is open for extension (register new widgets) but closed for modification (no shell changes needed).
- **Zero coupling** — `DashboardShell` and `WidgetContainer` only call `WidgetRegistry.renderWidget()`. They never import widget components directly.
- **Single registration point** — `widgets/index.ts` is the only file that knows about all widget implementations.
- **Metadata-driven UI** — "Add Widget" dropdown is populated from `getWidgetMetadata()`, automatically including new widgets.

**Consequences:**
- Widget definitions must be registered before the app renders (handled in `main.tsx` via side-effect import).
- Testing requires clearing the registry between tests (`WidgetRegistry.clear()`).
