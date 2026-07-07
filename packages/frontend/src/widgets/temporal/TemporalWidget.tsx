import { memo, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetProps, TemporalData } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { WidgetLoading, WidgetError, WidgetEmpty, widgetContainerStyle } from '../common/WidgetStates';
import { temporalWidgetConfig } from './config';

function TrendIndicator({
  direction,
  percentage,
}: {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
}) {
  const icons = { up: '↑', down: '↓', flat: '→' };
  const colors = { up: '#22c55e', down: '#ef4444', flat: '#6b7280' };

  return (
    <div className="trend-indicator" style={{ color: colors[direction] }}>
      <span className="trend-indicator__icon">{icons[direction]}</span>
      <span className="trend-indicator__text">
        {direction === 'flat' ? 'Stable' : `${Math.abs(percentage).toFixed(1)}%`}
      </span>
    </div>
  );
}

export const TemporalWidget = memo(function TemporalWidget({
  data,
  isLoading,
  error,
}: WidgetProps<TemporalData | null>) {
  const chartData = useMemo(() => {
    if (!data) return null;
    return dataTransformers.temporal.toChartFormat(data);
  }, [data]);

  if (isLoading) return <WidgetLoading />;
  if (error) return <WidgetError message={error} />;
  if (!chartData || chartData.points.length === 0) return <WidgetEmpty />;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', temporalWidgetConfig.dateFormat);

  return (
    <div style={widgetContainerStyle}>
      <div className="widget-header-extra">
        <TrendIndicator
          direction={chartData.trendDirection}
          percentage={chartData.trendPercentage}
        />
        {chartData.unit && (
          <span className="widget-unit">Unit: {chartData.unit}</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height="calc(100% - 30px)">
        <ComposedChart data={chartData.points} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(label) => formatDate(label as Date)}
            contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
          />
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="none"
            fill={temporalWidgetConfig.areaColor}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="none"
            fill="#ffffff"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={temporalWidgetConfig.lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
