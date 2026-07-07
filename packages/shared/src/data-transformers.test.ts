import { describe, it, expect } from 'vitest';
import {
  dataTransformers,
  DataTransformationError,
  calculatePearsonCorrelation,
} from '../src/index.js';

describe('categoricalTransformer', () => {
  const validData = {
    points: [
      { label: 'A', value: 10 },
      { label: 'B', value: 20, category: 'cat1' },
    ],
    metadata: { xAxisLabel: 'Category', yAxisLabel: 'Value' },
  };

  it('accepts valid data', () => {
    expect(dataTransformers.categorical.validate(validData)).toBe(true);
  });

  it('rejects invalid data', () => {
    expect(dataTransformers.categorical.validate({ points: [] })).toBe(false);
    expect(dataTransformers.categorical.validate({ points: [{ label: 'A' }] })).toBe(false);
  });

  it('transforms valid data', () => {
    const result = dataTransformers.categorical.transform(validData);
    expect(result.points).toHaveLength(2);
  });

  it('throws DataTransformationError for invalid input', () => {
    expect(() => dataTransformers.categorical.transform({})).toThrow(DataTransformationError);
  });

  it('produces correct chart format', () => {
    const chart = dataTransformers.categorical.toChartFormat(validData);
    expect(chart.points).toHaveLength(2);
    expect(chart.points[0]?.fill).toBeDefined();
    expect(chart.xAxisLabel).toBe('Category');
  });
});

describe('temporalTransformer', () => {
  const validData = {
    points: [
      { timestamp: '2024-01-02T00:00:00.000Z', value: 20 },
      { timestamp: '2024-01-01T00:00:00.000Z', value: 10 },
    ],
    granularity: 'day' as const,
  };

  it('accepts valid data', () => {
    expect(dataTransformers.temporal.validate(validData)).toBe(true);
  });

  it('rejects non-ISO timestamps', () => {
    const invalid = {
      points: [
        { timestamp: 'not-a-date', value: 10 },
        { timestamp: '2024-01-02T00:00:00.000Z', value: 20 },
      ],
      granularity: 'day',
    };
    expect(dataTransformers.temporal.validate(invalid)).toBe(false);
  });

  it('rejects fewer than 2 points', () => {
    expect(
      dataTransformers.temporal.validate({
        points: [{ timestamp: '2024-01-01T00:00:00.000Z', value: 10 }],
        granularity: 'day',
      }),
    ).toBe(false);
  });

  it('sorts points by timestamp', () => {
    const result = dataTransformers.temporal.transform(validData);
    const first = result.points[0];
    const last = result.points[result.points.length - 1];
    expect(first?.timestamp).toBe('2024-01-01T00:00:00.000Z');
    expect(last?.timestamp).toBe('2024-01-02T00:00:00.000Z');
  });

  it('calculates trend when missing', () => {
    const result = dataTransformers.temporal.transform(validData);
    expect(result.metadata?.trendDirection).toBe('up');
    expect(result.metadata?.trendPercentage).toBe(100);
  });

  it('throws DataTransformationError for invalid input', () => {
    expect(() => dataTransformers.temporal.transform({ points: [] })).toThrow(
      DataTransformationError,
    );
  });

  it('produces correct chart format', () => {
    const chart = dataTransformers.temporal.toChartFormat(validData);
    expect(chart.points).toHaveLength(2);
    expect(chart.points[0]?.date).toBeInstanceOf(Date);
  });
});

describe('hierarchicalTransformer', () => {
  const validData = {
    root: {
      name: 'Root',
      value: 100,
      children: [
        { name: 'Child', value: 50 },
        { name: 'Child2', value: 50 },
      ],
    },
    totalValue: 100,
  };

  const validDataWithDepth = {
    ...validData,
    depth: 2,
  };

  it('accepts valid data', () => {
    expect(dataTransformers.hierarchical.validate(validData)).toBe(true);
    expect(dataTransformers.hierarchical.validate(validDataWithDepth)).toBe(true);
  });

  it('rejects invalid data', () => {
    expect(dataTransformers.hierarchical.validate({ root: { name: 'x' } })).toBe(false);
  });

  it('calculates depth when missing', () => {
    const result = dataTransformers.hierarchical.transform(validData);
    expect(result.depth).toBe(2);
  });

  it('throws DataTransformationError for invalid input', () => {
    expect(() => dataTransformers.hierarchical.transform(null)).toThrow(
      DataTransformationError,
    );
  });

  it('produces correct chart format with flat nodes', () => {
    const chart = dataTransformers.hierarchical.toChartFormat(validData);
    expect(chart.flatNodes.length).toBeGreaterThanOrEqual(3);
    expect(chart.depth).toBe(2);
  });
});

describe('relationalTransformer', () => {
  const validData = {
    points: [
      { id: '1', x: 1, y: 2 },
      { id: '2', x: 2, y: 4 },
      { id: '3', x: 3, y: 6 },
    ],
    axes: { xLabel: 'X', yLabel: 'Y' },
  };

  it('accepts valid data', () => {
    expect(dataTransformers.relational.validate(validData)).toBe(true);
  });

  it('rejects invalid data', () => {
    expect(dataTransformers.relational.validate({ points: [], axes: {} })).toBe(false);
  });

  it('calculates Pearson correlation for positive correlation', () => {
    const result = dataTransformers.relational.transform(validData);
    expect(result.correlation?.coefficient).toBeCloseTo(1, 1);
    expect(result.correlation?.type).toBe('positive');
  });

  it('throws DataTransformationError for invalid input', () => {
    expect(() => dataTransformers.relational.transform({})).toThrow(DataTransformationError);
  });

  it('produces correct chart format with regression line', () => {
    const chart = dataTransformers.relational.toChartFormat(validData);
    expect(chart.points).toHaveLength(3);
    expect(chart.regressionLine).toBeDefined();
    expect(chart.regressionLine?.length).toBe(2);
  });
});

describe('calculatePearsonCorrelation', () => {
  it('returns ~1 for perfect positive correlation', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    expect(calculatePearsonCorrelation(xs, ys)).toBeCloseTo(1, 5);
  });

  it('returns ~-1 for perfect negative correlation', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [10, 8, 6, 4, 2];
    expect(calculatePearsonCorrelation(xs, ys)).toBeCloseTo(-1, 5);
  });
});
