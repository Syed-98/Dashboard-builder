import type { WidgetConfig, WidgetType } from '@dashboard-builder/shared';

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetState {
  data: unknown;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface DashboardState {
  dashboardId: string;
  dashboardName: string;
  widgetConfigs: Record<string, WidgetConfig>;
  layouts: GridLayout[];
  widgetStates: Record<string, WidgetState>;
  selectedWidgetId: string | null;
  isEditMode: boolean;
}

export const DEFAULT_WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  'widget-categorical': {
    id: 'widget-categorical',
    type: 'categorical',
    title: 'Revenue by Category',
    refreshInterval: 5000,
  },
  'widget-temporal': {
    id: 'widget-temporal',
    type: 'temporal',
    title: 'Daily Requests',
    refreshInterval: 5000,
  },
  'widget-hierarchical': {
    id: 'widget-hierarchical',
    type: 'hierarchical',
    title: 'Organization Breakdown',
    refreshInterval: 5000,
  },
  'widget-relational': {
    id: 'widget-relational',
    type: 'relational',
    title: 'Marketing vs Revenue',
    refreshInterval: 5000,
  },
};

export const DEFAULT_LAYOUTS: GridLayout[] = [
  { i: 'widget-categorical', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { i: 'widget-temporal', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { i: 'widget-hierarchical', x: 0, y: 4, w: 6, h: 5, minW: 3, minH: 3 },
  { i: 'widget-relational', x: 6, y: 4, w: 6, h: 5, minW: 3, minH: 3 },
];

export const initialState: DashboardState = {
  dashboardId: 'default-dashboard',
  dashboardName: 'My Dashboard',
  widgetConfigs: DEFAULT_WIDGET_CONFIGS,
  layouts: DEFAULT_LAYOUTS,
  widgetStates: {},
  selectedWidgetId: null,
  isEditMode: false,
};

export function createWidgetId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultWidgetState(): WidgetState {
  return {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  };
}

export function getDefaultLayoutForType(
  widgetId: string,
  type: WidgetType,
  existingLayouts: GridLayout[],
): GridLayout {
  const maxY = existingLayouts.reduce((max, layout) => Math.max(max, layout.y + layout.h), 0);
  const sizes: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
    categorical: { w: 6, h: 4, minW: 3, minH: 3 },
    temporal: { w: 6, h: 4, minW: 3, minH: 3 },
    hierarchical: { w: 6, h: 5, minW: 3, minH: 3 },
    relational: { w: 6, h: 5, minW: 3, minH: 3 },
  };
  const size = sizes[type];
  return {
    i: widgetId,
    x: 0,
    y: maxY,
    w: size.w,
    h: size.h,
    minW: size.minW,
    minH: size.minH,
  };
}
