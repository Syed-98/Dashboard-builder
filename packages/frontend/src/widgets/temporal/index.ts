import type { ComponentType } from 'react';
import type { WidgetDefinition, WidgetProps } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { TemporalWidget } from './TemporalWidget';

export const temporalWidgetDefinition: WidgetDefinition = {
  type: 'temporal',
  displayName: 'Time Series',
  defaultConfig: {
    title: 'Time Series',
  },
  defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
  component: TemporalWidget as ComponentType<WidgetProps<unknown>>,
  dataTransformer: dataTransformers.temporal.transform,
  validateData: dataTransformers.temporal.validate,
};

export { TemporalWidget } from './TemporalWidget';
