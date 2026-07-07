import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, type ReactNode } from 'react';
import type { WidgetDefinition } from '@dashboard-builder/shared';
import { WidgetRegistry } from './registry';

function createMockDefinition(type: 'categorical' | 'temporal'): WidgetDefinition {
  return {
    type,
    displayName: type === 'categorical' ? 'Bar Chart' : 'Time Series',
    defaultConfig: { title: 'Test' },
    defaultSize: { w: 6, h: 4 },
    component: () => createElement('div', null, 'mock') as unknown as ReactNode,
    dataTransformer: (raw: unknown) => raw,
    validateData: (data: unknown): data is unknown => data !== null,
  };
}

describe('WidgetRegistry', () => {
  beforeEach(() => {
    WidgetRegistry.clear();
  });

  it('register adds to registry', () => {
    const def = createMockDefinition('categorical');
    WidgetRegistry.register(def);
    expect(WidgetRegistry.has('categorical')).toBe(true);
    expect(WidgetRegistry.get('categorical')).toBe(def);
  });

  it('get returns undefined for unregistered type', () => {
    expect(WidgetRegistry.get('temporal')).toBeUndefined();
  });

  it('getRegisteredTypes returns all types', () => {
    WidgetRegistry.register(createMockDefinition('categorical'));
    WidgetRegistry.register(createMockDefinition('temporal'));
    const types = WidgetRegistry.getRegisteredTypes();
    expect(types).toContain('categorical');
    expect(types).toContain('temporal');
    expect(types).toHaveLength(2);
  });

  it('getWidgetMetadata excludes component', () => {
    WidgetRegistry.register(createMockDefinition('categorical'));
    const metadata = WidgetRegistry.getWidgetMetadata();
    expect(metadata).toHaveLength(1);
    expect(metadata[0]).toEqual({
      type: 'categorical',
      displayName: 'Bar Chart',
      defaultSize: { w: 6, h: 4 },
    });
    expect(metadata[0]).not.toHaveProperty('component');
    expect(metadata[0]).not.toHaveProperty('dataTransformer');
  });

  it('renderWidget returns null for unregistered type', () => {
    const result = WidgetRegistry.renderWidget('hierarchical', {
      data: null,
      config: { id: '1', type: 'hierarchical', title: 'Test', refreshInterval: 5000 },
    });
    expect(result).toBeNull();
  });

  it('renderWidget returns element for registered type', () => {
    WidgetRegistry.register(createMockDefinition('categorical'));
    const result = WidgetRegistry.renderWidget('categorical', {
      data: null,
      config: { id: '1', type: 'categorical', title: 'Test', refreshInterval: 5000 },
    });
    expect(result).not.toBeNull();
  });
});
