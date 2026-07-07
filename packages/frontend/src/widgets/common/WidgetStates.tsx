import type { CSSProperties } from 'react';

export function WidgetLoading() {
  return (
    <div className="widget-state widget-state--loading">
      <div className="widget-spinner" />
      <span>Loading...</span>
    </div>
  );
}

export function WidgetError({ message }: { message: string }) {
  return (
    <div className="widget-state widget-state--error">
      <span className="widget-state__icon">⚠</span>
      <span>{message}</span>
    </div>
  );
}

export function WidgetEmpty() {
  return (
    <div className="widget-state widget-state--empty">
      <span>No data available</span>
    </div>
  );
}

export const widgetContainerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 200,
};
