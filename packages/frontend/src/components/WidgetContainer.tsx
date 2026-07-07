import { memo, useCallback } from 'react';
import type { WidgetConfig } from '@dashboard-builder/shared';
import { WidgetRegistry } from '../engine/registry';
import { useDashboardStore } from '../engine/store';
import { useWidgetData } from '../engine/hooks/useWidgetData';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface WidgetContainerProps {
  widgetId: string;
}

export const WidgetContainer = memo(function WidgetContainer({
  widgetId,
}: WidgetContainerProps) {
  const config = useDashboardStore((s) => s.widgetConfigs[widgetId]);
  const isSelected = useDashboardStore((s) => s.selectedWidgetId === widgetId);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const selectWidget = useDashboardStore((s) => s.selectWidget);

  const { data, isLoading, error, refetch } = useWidgetData(
    widgetId,
    config?.type ?? 'categorical',
    { enabled: !!config },
  );

  const handleSelect = useCallback(() => {
    selectWidget(widgetId);
  }, [selectWidget, widgetId]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeWidget(widgetId);
    },
    [removeWidget, widgetId],
  );

  const handleRefresh = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void refetch();
    },
    [refetch],
  );

  if (!config) {
    return null;
  }

  return (
    <div
      className={`widget-container ${isSelected ? 'widget-container--selected' : ''}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleSelect();
      }}
    >
      <div className="widget-container__header">
        <h3 className="widget-container__title">{config.title}</h3>
        <div className="widget-container__actions">
          <button
            type="button"
            className="widget-container__action-btn"
            onClick={handleRefresh}
            title="Refresh"
            aria-label="Refresh widget data"
          >
            ↻
          </button>
          {isEditMode && (
            <button
              type="button"
              className="widget-container__action-btn widget-container__action-btn--danger"
              onClick={handleRemove}
              title="Remove"
              aria-label="Remove widget"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="widget-container__body">
        <WidgetErrorBoundary onRetry={() => void refetch()}>
          {WidgetRegistry.renderWidget(config.type, {
            data,
            config: config as WidgetConfig,
            isLoading,
            error,
          })}
        </WidgetErrorBoundary>
      </div>
    </div>
  );
});
