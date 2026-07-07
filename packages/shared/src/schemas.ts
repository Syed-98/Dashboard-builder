import { z } from 'zod';
import { GRANULARITIES, WIDGET_TYPES } from './types.js';

export const categoricalPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  category: z.string().optional(),
});

export const categoricalDataSchema = z.object({
  points: z.array(categoricalPointSchema).min(1),
  metadata: z
    .object({
      xAxisLabel: z.string().optional(),
      yAxisLabel: z.string().optional(),
    })
    .optional(),
});

export type CategoricalData = z.infer<typeof categoricalDataSchema>;
export type CategoricalPoint = z.infer<typeof categoricalPointSchema>;

export const temporalPointSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
  upperBound: z.number().optional(),
  lowerBound: z.number().optional(),
});

export const temporalDataSchema = z.object({
  points: z.array(temporalPointSchema).min(2),
  granularity: z.enum(GRANULARITIES),
  metadata: z
    .object({
      unit: z.string().optional(),
      trendDirection: z.enum(['up', 'down', 'flat']).optional(),
      trendPercentage: z.number().optional(),
    })
    .optional(),
});

export type TemporalData = z.infer<typeof temporalDataSchema>;
export type TemporalPoint = z.infer<typeof temporalPointSchema>;

export interface HierarchicalNode {
  name: string;
  value: number;
  children?: HierarchicalNode[];
}

export const hierarchicalNodeSchema: z.ZodType<HierarchicalNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    value: z.number(),
    children: z.array(hierarchicalNodeSchema).optional(),
  }),
);

export const hierarchicalDataSchema = z.object({
  root: hierarchicalNodeSchema,
  totalValue: z.number(),
  depth: z.number().int().min(1).optional(),
});

export type HierarchicalData = z.infer<typeof hierarchicalDataSchema>;

export const relationalPointSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.number().optional(),
  category: z.string().optional(),
  label: z.string().optional(),
});

export const relationalDataSchema = z.object({
  points: z.array(relationalPointSchema).min(1),
  axes: z.object({
    xLabel: z.string(),
    yLabel: z.string(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    yRange: z.tuple([z.number(), z.number()]).optional(),
  }),
  correlation: z
    .object({
      coefficient: z.number().min(-1).max(1),
      type: z.enum(['positive', 'negative', 'none']),
    })
    .optional(),
});

export type RelationalData = z.infer<typeof relationalDataSchema>;
export type RelationalPoint = z.infer<typeof relationalPointSchema>;

export const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(WIDGET_TYPES),
  title: z.string(),
  dataSource: z.string().optional(),
  refreshInterval: z.number().int().positive().default(5000),
  customConfig: z.record(z.unknown()).optional(),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

export const widgetDataRequestSchema = z.object({
  widgetId: z.string(),
  type: z.enum(WIDGET_TYPES),
});

export type WidgetDataRequest = z.infer<typeof widgetDataRequestSchema>;

export const widgetDataResponseSchema = z.object({
  widgetId: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type WidgetDataResponse = z.infer<typeof widgetDataResponseSchema>;

export const batchWidgetDataRequestSchema = z.object({
  requests: z.array(widgetDataRequestSchema).min(1).max(20),
});

export type BatchWidgetDataRequest = z.infer<typeof batchWidgetDataRequestSchema>;

export const batchWidgetDataResponseSchema = z.object({
  results: z.array(widgetDataResponseSchema),
  timestamp: z.string().datetime(),
});

export type BatchWidgetDataResponse = z.infer<typeof batchWidgetDataResponseSchema>;
