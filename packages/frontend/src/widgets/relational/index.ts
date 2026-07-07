import type { ComponentType } from 'react';
import type { WidgetDefinition, WidgetProps } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { RelationalWidget } from './RelationalWidget';

export const relationalWidgetDefinition: WidgetDefinition = {
  type: 'relational',
  displayName: 'Scatter Plot',
  defaultConfig: {
    title: 'Scatter Plot',
  },
  defaultSize: { w: 6, h: 5, minW: 3, minH: 3 },
  component: RelationalWidget as ComponentType<WidgetProps<unknown>>,
  dataTransformer: dataTransformers.relational.transform,
  validateData: dataTransformers.relational.validate,
};

export { RelationalWidget } from './RelationalWidget';
