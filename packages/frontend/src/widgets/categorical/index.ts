import type { ComponentType } from 'react';
import type { WidgetDefinition, WidgetProps } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { CategoricalWidget } from './CategoricalWidget';

export const categoricalWidgetDefinition: WidgetDefinition = {
  type: 'categorical',
  displayName: 'Bar Chart',
  defaultConfig: {
    title: 'Bar Chart',
  },
  defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
  component: CategoricalWidget as ComponentType<WidgetProps<unknown>>,
  dataTransformer: dataTransformers.categorical.transform,
  validateData: dataTransformers.categorical.validate,
};

export { CategoricalWidget } from './CategoricalWidget';
