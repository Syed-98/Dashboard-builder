import { useCallback, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetRegistry } from '../engine/registry';
import { useDashboard } from '../engine/hooks/useDashboard';
import { WidgetContainer } from './WidgetContainer';
import type { GridLayout } from '../engine/types';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardShell() {
  const {
    widgetConfigs,
    dashboardName,
    layouts,
    isEditMode,
    addWidget,
    updateLayouts,
    toggleEditMode,
    renameDashboard,
    resetDashboard,
    batchFetchAllWidgetData,
  } = useDashboard();

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const widgetIds = Object.keys(widgetConfigs);
  const widgetCount = widgetIds.length;
  const metadata = WidgetRegistry.getWidgetMetadata();

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const updated: GridLayout[] = currentLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
      }));
      updateLayouts(updated);
    },
    [updateLayouts],
  );

  const handleAddWidget = useCallback(
    (type: Parameters<typeof addWidget>[0]) => {
      addWidget(type);
      setIsAddMenuOpen(false);
    },
    [addWidget],
  );

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await batchFetchAllWidgetData();
    } finally {
      setIsRefreshing(false);
    }
  }, [batchFetchAllWidgetData]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset dashboard to default layout? This cannot be undone.')) {
      resetDashboard();
    }
  }, [resetDashboard]);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-toolbar">
        <div className="dashboard-toolbar__left">
          <input
            type="text"
            className="dashboard-toolbar__title-input"
            value={dashboardName}
            onChange={(e) => renameDashboard(e.target.value)}
            aria-label="Dashboard name"
          />
          <span className="dashboard-toolbar__count">{widgetCount} widgets</span>
        </div>
        <div className="dashboard-toolbar__right">
          <div className="dashboard-toolbar__dropdown">
            <button
              type="button"
              className="dashboard-toolbar__btn"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              disabled={!isEditMode}
            >
              + Add Widget
            </button>
            {isAddMenuOpen && (
              <div className="dashboard-toolbar__menu">
                {metadata.map((meta) => (
                  <button
                    key={meta.type}
                    type="button"
                    className="dashboard-toolbar__menu-item"
                    onClick={() => handleAddWidget(meta.type)}
                  >
                    {meta.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="dashboard-toolbar__btn"
            onClick={() => void handleRefreshAll()}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </button>
          <button
            type="button"
            className={`dashboard-toolbar__btn ${isEditMode ? 'dashboard-toolbar__btn--active' : ''}`}
            onClick={toggleEditMode}
          >
            {isEditMode ? '🔓 Edit Mode' : '🔒 Locked'}
          </button>
          <button
            type="button"
            className="dashboard-toolbar__btn dashboard-toolbar__btn--danger"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {widgetCount === 0 ? (
          <div className="dashboard-empty">
            <p>No widgets yet. Enable edit mode and add a widget to get started.</p>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layouts }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-container__header"
          >
            {widgetIds.map((id) => (
              <div key={id}>
                <WidgetContainer widgetId={id} />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </main>
    </div>
  );
}
