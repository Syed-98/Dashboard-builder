import { describe, it, expect } from 'vitest';
import {
  categoricalDataSchema,
  temporalDataSchema,
  hierarchicalDataSchema,
  relationalDataSchema,
} from '@dashboard-builder/shared';
import { MockDataEngine } from '../src/mock-engine.js';

describe('MockDataEngine', () => {
  const engine = new MockDataEngine(42);

  it('generates valid categorical data', async () => {
    const data = await engine.generate('categorical', 'test-1');
    const result = categoricalDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.points).toHaveLength(6);
    }
  });

  it('generates valid temporal data with ISO-8601 timestamps in order', async () => {
    const data = await engine.generate('temporal', 'test-2');
    const result = temporalDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.points.length).toBe(30);
      for (const point of result.data.points) {
        expect(() => new Date(point.timestamp).toISOString()).not.toThrow();
        expect(point.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
      const timestamps = result.data.points.map((p) => new Date(p.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]!);
      }
    }
  });

  it('generates valid hierarchical data with >=2 levels', async () => {
    const data = await engine.generate('hierarchical', 'test-3');
    const result = hierarchicalDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.depth).toBeGreaterThanOrEqual(2);
      expect(result.data.root.children).toBeDefined();
      expect(result.data.root.children!.length).toBeGreaterThan(0);
    }
  });

  it('generates valid relational data with x,y coordinates', async () => {
    const data = await engine.generate('relational', 'test-4');
    const result = relationalDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.points).toHaveLength(50);
      for (const point of result.data.points) {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.id).toBeDefined();
      }
    }
  });

  it('throws error for unknown widget type', async () => {
    await expect(
      engine.generate('unknown' as 'categorical', 'test-5'),
    ).rejects.toThrow('Unknown widget type');
  });
});
