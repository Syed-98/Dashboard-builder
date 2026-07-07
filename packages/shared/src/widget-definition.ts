import type { ComponentType } from 'react';
import type {
  CategoricalData,
  HierarchicalData,
  RelationalData,
  TemporalData,
  WidgetConfig,
} from './schemas.js';
import type { WidgetType } from './types.js';

export interface WidgetProps<TData> {
  data: TData;
  config: WidgetConfig;
  isLoading?: boolean;
  error?: string | null;
}

export interface WidgetDefinition<TConfig = Record<string, unknown>, TData = unknown> {
  type: WidgetType;
  displayName: string;
  defaultConfig: Partial<WidgetConfig> & { customConfig?: TConfig };
  defaultSize: { w: number; h: number; minW?: number; minH?: number };
  component: ComponentType<WidgetProps<TData>>;
  dataTransformer: (raw: unknown) => TData;
  validateData: (data: unknown) => data is TData;
}
