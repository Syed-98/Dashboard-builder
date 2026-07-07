import { memo, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import type { WidgetProps, RelationalData } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { WidgetLoading, WidgetError, WidgetEmpty, widgetContainerStyle } from '../common/WidgetStates';
import { CATEGORY_COLORS, relationalWidgetConfig } from './config';

function CorrelationBadge({
  coefficient,
  type,
}: {
  coefficient: number;
  type: string;
}) {
  const colors: Record<string, string> = {
    positive: '#22c55e',
    negative: '#ef4444',
    none: '#6b7280',
  };

  return (
    <div className="correlation-badge" style={{ color: colors[type] ?? '#6b7280' }}>
      <span>r = {coefficient.toFixed(3)}</span>
      <span className="correlation-badge__type">({type})</span>
    </div>
  );
}

export const RelationalWidget = memo(function RelationalWidget({
  data,
  isLoading,
  error,
}: WidgetProps<RelationalData | null>) {
  const chartData = useMemo(() => {
    if (!data) return null;
    return dataTransformers.relational.toChartFormat(data);
  }, [data]);

  if (isLoading) return <WidgetLoading />;
  if (error) return <WidgetError message={error} />;
  if (!chartData || chartData.points.length === 0) return <WidgetEmpty />;

  const categories = Object.keys(chartData.pointsByCategory);
  const showRegression =
    chartData.regressionLine &&
    Math.abs(chartData.correlation.coefficient) > relationalWidgetConfig.correlationThreshold;

  return (
    <div style={widgetContainerStyle}>
      <div className="widget-header-extra">
        <CorrelationBadge
          coefficient={chartData.correlation.coefficient}
          type={chartData.correlation.type}
        />
      </div>
      <ResponsiveContainer width="100%" height="calc(100% - 30px)">
        {showRegression ? (
          <ComposedChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              dataKey="x"
              name={chartData.xLabel}
              tick={{ fontSize: 11 }}
              label={{ value: chartData.xLabel, position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={chartData.yLabel}
              tick={{ fontSize: 11 }}
              label={{ value: chartData.yLabel, angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="size" range={[30, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
            />
            {categories.map((category, index) => (
              <Scatter
                key={category}
                name={category}
                data={chartData.pointsByCategory[category]}
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
              />
            ))}
            <Line
              data={chartData.regressionLine}
              dataKey="y"
              stroke="#ff7300"
              strokeWidth={2}
              dot={false}
              legendType="none"
            />
          </ComposedChart>
        ) : (
          <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              dataKey="x"
              name={chartData.xLabel}
              tick={{ fontSize: 11 }}
              label={{ value: chartData.xLabel, position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={chartData.yLabel}
              tick={{ fontSize: 11 }}
              label={{ value: chartData.yLabel, angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="size" range={[30, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
            />
            {categories.map((category, index) => (
              <Scatter
                key={category}
                name={category}
                data={chartData.pointsByCategory[category]}
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
              />
            ))}
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  );
});
