import { DataTransformationError } from './errors.js';
import {
  categoricalDataSchema,
  hierarchicalDataSchema,
  relationalDataSchema,
  temporalDataSchema,
  type CategoricalData,
  type HierarchicalData,
  type RelationalData,
  type TemporalData,
} from './schemas.js';
import {
  calculatePearsonCorrelation,
  calculateTreeDepth,
  calculateTrend,
  flattenTree,
  getCorrelationType,
} from './utils.js';

export interface CategoricalChartPoint {
  label: string;
  value: number;
  category: string;
  fill: string;
}

export interface CategoricalChartFormat {
  points: CategoricalChartPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface TemporalChartPoint {
  timestamp: string;
  date: Date;
  value: number;
  upperBound: number | null;
  lowerBound: number | null;
}

export interface TemporalChartFormat {
  points: TemporalChartPoint[];
  granularity: string;
  unit?: string;
  trendDirection: 'up' | 'down' | 'flat';
  trendPercentage: number;
}

export interface HierarchicalChartNode {
  name: string;
  value: number;
  depth: number;
  path: string;
  children?: HierarchicalChartNode[];
}

export interface HierarchicalChartFormat {
  root: HierarchicalChartNode;
  flatNodes: ReturnType<typeof flattenTree>;
  totalValue: number;
  depth: number;
}

export type TransformedHierarchicalData = HierarchicalData & { depth: number };

export interface RelationalChartPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  category: string;
  label?: string;
}

export interface RelationalChartFormat {
  points: RelationalChartPoint[];
  pointsByCategory: Record<string, RelationalChartPoint[]>;
  xLabel: string;
  yLabel: string;
  xRange?: [number, number];
  yRange?: [number, number];
  correlation: {
    coefficient: number;
    type: 'positive' | 'negative' | 'none';
  };
  regressionLine?: Array<{ x: number; y: number }>;
}

const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c43',
  '#a4de6c',
  '#d0ed57',
  '#8dd1e1',
  '#83a6ed',
];

function toChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? '#8884d8';
}

function transformHierarchicalNode(
  node: HierarchicalData['root'],
  depth = 0,
  path = '',
): HierarchicalChartNode {
  const currentPath = path ? `${path}/${node.name}` : node.name;
  return {
    name: node.name,
    value: node.value,
    depth,
    path: currentPath,
    children: node.children?.map((child) =>
      transformHierarchicalNode(child, depth + 1, currentPath),
    ),
  };
}

function calculateRegressionLine(
  points: Array<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
  const n = points.length;
  if (n < 2) return [];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - meanX;
    num += dx * ((ys[i] ?? 0) - meanY);
    den += dx * dx;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ];
}

export const categoricalTransformer = {
  validate(data: unknown): data is CategoricalData {
    return categoricalDataSchema.safeParse(data).success;
  },

  transform(raw: unknown): CategoricalData {
    const result = categoricalDataSchema.safeParse(raw);
    if (!result.success) {
      throw new DataTransformationError(
        'Invalid categorical data',
        result.error.flatten(),
      );
    }
    return result.data;
  },

  toChartFormat(data: CategoricalData): CategoricalChartFormat {
    return {
      points: data.points.map((point, index) => ({
        label: point.label,
        value: point.value,
        category: point.category ?? point.label,
        fill: toChartColor(index),
      })),
      xAxisLabel: data.metadata?.xAxisLabel,
      yAxisLabel: data.metadata?.yAxisLabel,
    };
  },
};

export const temporalTransformer = {
  validate(data: unknown): data is TemporalData {
    return temporalDataSchema.safeParse(data).success;
  },

  transform(raw: unknown): TemporalData {
    const result = temporalDataSchema.safeParse(raw);
    if (!result.success) {
      throw new DataTransformationError(
        'Invalid temporal data',
        result.error.flatten(),
      );
    }

    const sortedPoints = [...result.data.points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const trend = calculateTrend(sortedPoints);
    const metadata = result.data.metadata ?? {};

    return {
      ...result.data,
      points: sortedPoints,
      metadata: {
        ...metadata,
        trendDirection: metadata.trendDirection ?? trend.trendDirection,
        trendPercentage: metadata.trendPercentage ?? trend.trendPercentage,
      },
    };
  },

  toChartFormat(data: TemporalData): TemporalChartFormat {
    const transformed = temporalTransformer.transform(data);
    return {
      points: transformed.points.map((point) => ({
        timestamp: point.timestamp,
        date: new Date(point.timestamp),
        value: point.value,
        upperBound: point.upperBound ?? null,
        lowerBound: point.lowerBound ?? null,
      })),
      granularity: transformed.granularity,
      unit: transformed.metadata?.unit,
      trendDirection: transformed.metadata?.trendDirection ?? 'flat',
      trendPercentage: transformed.metadata?.trendPercentage ?? 0,
    };
  },
};

export const hierarchicalTransformer = {
  validate(data: unknown): data is HierarchicalData {
    return hierarchicalDataSchema.safeParse(data).success;
  },

  transform(raw: unknown): TransformedHierarchicalData {
    const result = hierarchicalDataSchema.safeParse(raw);
    if (!result.success) {
      throw new DataTransformationError(
        'Invalid hierarchical data',
        result.error.flatten(),
      );
    }

    const depth = result.data.depth ?? calculateTreeDepth(result.data.root);

    return {
      root: result.data.root,
      totalValue: result.data.totalValue,
      depth,
    };
  },

  toChartFormat(data: HierarchicalData): HierarchicalChartFormat {
    const transformed = hierarchicalTransformer.transform(data);
    const root = transformHierarchicalNode(transformed.root);
    return {
      root,
      flatNodes: flattenTree(transformed.root),
      totalValue: transformed.totalValue,
      depth: transformed.depth,
    };
  },
};

export const relationalTransformer = {
  validate(data: unknown): data is RelationalData {
    return relationalDataSchema.safeParse(data).success;
  },

  transform(raw: unknown): RelationalData {
    const result = relationalDataSchema.safeParse(raw);
    if (!result.success) {
      throw new DataTransformationError(
        'Invalid relational data',
        result.error.flatten(),
      );
    }

    let correlation = result.data.correlation;
    if (!correlation) {
      const xs = result.data.points.map((p) => p.x);
      const ys = result.data.points.map((p) => p.y);
      const coefficient = calculatePearsonCorrelation(xs, ys);
      correlation = {
        coefficient: Math.round(coefficient * 1000) / 1000,
        type: getCorrelationType(coefficient),
      };
    }

    return {
      ...result.data,
      correlation,
    };
  },

  toChartFormat(data: RelationalData): RelationalChartFormat {
    const transformed = relationalTransformer.transform(data);
    const points: RelationalChartPoint[] = transformed.points.map((point) => ({
      id: point.id,
      x: point.x,
      y: point.y,
      size: point.size ?? 10,
      category: point.category ?? 'default',
      label: point.label,
    }));

    const pointsByCategory: Record<string, RelationalChartPoint[]> = {};
    for (const point of points) {
      const cat = point.category;
      if (!pointsByCategory[cat]) {
        pointsByCategory[cat] = [];
      }
      pointsByCategory[cat].push(point);
    }

    const correlation = transformed.correlation ?? {
      coefficient: 0,
      type: 'none' as const,
    };

    const regressionLine =
      Math.abs(correlation.coefficient) > 0.3
        ? calculateRegressionLine(points)
        : undefined;

    return {
      points,
      pointsByCategory,
      xLabel: transformed.axes.xLabel,
      yLabel: transformed.axes.yLabel,
      xRange: transformed.axes.xRange,
      yRange: transformed.axes.yRange,
      correlation,
      regressionLine,
    };
  },
};

export const dataTransformers = {
  categorical: categoricalTransformer,
  temporal: temporalTransformer,
  hierarchical: hierarchicalTransformer,
  relational: relationalTransformer,
} as const;

export type DataTransformerType = keyof typeof dataTransformers;
