import { useCallback } from 'react';
import {
  dataTransformers,
  DataTransformationError,
  type WidgetType,
  type BatchWidgetDataResponse,
} from '@dashboard-builder/shared';
import { useDashboardStore } from '../store';

export function useDashboard() {
  const widgetConfigs = useDashboardStore((s) => s.widgetConfigs);
  const dashboardName = useDashboardStore((s) => s.dashboardName);
  const layouts = useDashboardStore((s) => s.layouts);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const selectedWidgetId = useDashboardStore((s) => s.selectedWidgetId);

  const addWidget = useDashboardStore((s) => s.addWidget);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);
  const updateLayouts = useDashboardStore((s) => s.updateLayouts);
  const selectWidget = useDashboardStore((s) => s.selectWidget);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const renameDashboard = useDashboardStore((s) => s.renameDashboard);
  const resetDashboard = useDashboardStore((s) => s.resetDashboard);
  const setWidgetData = useDashboardStore((s) => s.setWidgetData);
  const setWidgetLoading = useDashboardStore((s) => s.setWidgetLoading);
  const setWidgetError = useDashboardStore((s) => s.setWidgetError);

  const safeAddWidget = useCallback(
    (type: WidgetType) => {
      try {
        return addWidget(type);
      } catch (error) {
        console.error('Failed to add widget:', error);
        return null;
      }
    },
    [addWidget],
  );

  const batchFetchAllWidgetData = useCallback(async () => {
    const configs = Object.values(widgetConfigs);
    if (configs.length === 0) return;

    for (const config of configs) {
      setWidgetLoading(config.id, true);
      setWidgetError(config.id, null);
    }

    try {
      const response = await fetch('/api/widgets/data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: configs.map((c) => ({ widgetId: c.id, type: c.type })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch fetch failed: ${response.status}`);
      }

      const batchResponse = (await response.json()) as BatchWidgetDataResponse;

      for (const result of batchResponse.results) {
        if (!result.success || !result.data) {
          setWidgetError(result.widgetId, result.error ?? 'Failed to fetch data');
          continue;
        }

        const config = widgetConfigs[result.widgetId];
        if (!config) continue;

        try {
          const transformer = dataTransformers[config.type];
          const transformed = transformer.transform(result.data);
          setWidgetData(result.widgetId, transformed);
        } catch (error) {
          if (error instanceof DataTransformationError) {
            setWidgetError(
              result.widgetId,
              `Data transformation error: ${error.message}`,
            );
          } else {
            setWidgetError(result.widgetId, 'Failed to transform data');
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Batch fetch failed';
      for (const config of configs) {
        setWidgetError(config.id, message);
      }
    }
  }, [widgetConfigs, setWidgetData, setWidgetLoading, setWidgetError]);

  return {
    widgetConfigs,
    dashboardName,
    layouts,
    isEditMode,
    selectedWidgetId,
    addWidget: safeAddWidget,
    removeWidget,
    updateWidgetConfig,
    updateLayouts,
    selectWidget,
    toggleEditMode,
    renameDashboard,
    resetDashboard,
    batchFetchAllWidgetData,
  };
}
