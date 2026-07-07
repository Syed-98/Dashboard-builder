import type { ComponentType } from 'react';
import type { WidgetDefinition, WidgetProps } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { HierarchicalWidget } from './HierarchicalWidget';

export const hierarchicalWidgetDefinition: WidgetDefinition = {
  type: 'hierarchical',
  displayName: 'Treemap',
  defaultConfig: {
    title: 'Treemap',
  },
  defaultSize: { w: 6, h: 5, minW: 3, minH: 3 },
  component: HierarchicalWidget as ComponentType<WidgetProps<unknown>>,
  dataTransformer: dataTransformers.hierarchical.transform,
  validateData: dataTransformers.hierarchical.validate,
};

export { HierarchicalWidget } from './HierarchicalWidget';
