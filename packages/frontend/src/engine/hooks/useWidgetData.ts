import { useCallback, useEffect, useRef } from 'react';
import {
  dataTransformers,
  DataTransformationError,
  type WidgetType,
  type WidgetDataResponse,
} from '@dashboard-builder/shared';
import { useDashboardStore } from '../store';

interface UseWidgetDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

async function fetchWidgetData(
  widgetId: string,
  widgetType: WidgetType,
): Promise<WidgetDataResponse> {
  const response = await fetch('/api/widgets/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgetId, type: widgetType }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<WidgetDataResponse>;
}

export function useWidgetData(
  widgetId: string,
  widgetType: WidgetType,
  options: UseWidgetDataOptions = {},
) {
  const { enabled = true } = options;
  const config = useDashboardStore((s) => s.widgetConfigs[widgetId]);
  const widgetState = useDashboardStore((s) => s.widgetStates[widgetId]);
  const setWidgetData = useDashboardStore((s) => s.setWidgetData);
  const setWidgetLoading = useDashboardStore((s) => s.setWidgetLoading);
  const setWidgetError = useDashboardStore((s) => s.setWidgetError);

  const refreshInterval = options.refreshInterval ?? config?.refreshInterval ?? 5000;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setWidgetLoading(widgetId, true);
    setWidgetError(widgetId, null);

    try {
      const response = await fetchWidgetData(widgetId, widgetType);

      if (!response.success || !response.data) {
        setWidgetError(widgetId, response.error ?? 'Failed to fetch widget data');
        return;
      }

      const transformer = dataTransformers[widgetType];
      const transformed = transformer.transform(response.data);
      setWidgetData(widgetId, transformed);
    } catch (error) {
      if (error instanceof DataTransformationError) {
        setWidgetError(widgetId, `Data transformation error: ${error.message}`);
      } else if (error instanceof Error) {
        setWidgetError(widgetId, error.message);
      } else {
        setWidgetError(widgetId, 'An unknown error occurred');
      }
    }
  }, [widgetId, widgetType, enabled, setWidgetData, setWidgetLoading, setWidgetError]);

  useEffect(() => {
    if (!enabled) return;

    void fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        void fetchData();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval, enabled]);

  return {
    data: widgetState?.data ?? null,
    isLoading: widgetState?.isLoading ?? false,
    error: widgetState?.error ?? null,
    lastUpdated: widgetState?.lastUpdated ?? null,
    refetch: fetchData,
  };
}
