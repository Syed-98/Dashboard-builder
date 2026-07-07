export const WIDGET_TYPES = [
  'categorical',
  'temporal',
  'hierarchical',
  'relational',
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

export const GRANULARITIES = [
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'year',
] as const;

export type Granularity = (typeof GRANULARITIES)[number];

export const TREND_DIRECTIONS = ['up', 'down', 'flat'] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export const CORRELATION_TYPES = ['positive', 'negative', 'none'] as const;
export type CorrelationType = (typeof CORRELATION_TYPES)[number];
