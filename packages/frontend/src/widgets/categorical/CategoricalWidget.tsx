import { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WidgetProps, CategoricalData } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { WidgetLoading, WidgetError, WidgetEmpty, widgetContainerStyle } from '../common/WidgetStates';
import { categoricalWidgetConfig } from './config';

export const CategoricalWidget = memo(function CategoricalWidget({
  data,
  isLoading,
  error,
}: WidgetProps<CategoricalData | null>) {
  const chartData = useMemo(() => {
    if (!data) return null;
    return dataTransformers.categorical.toChartFormat(data);
  }, [data]);

  if (isLoading) return <WidgetLoading />;
  if (error) return <WidgetError message={error} />;
  if (!chartData || chartData.points.length === 0) return <WidgetEmpty />;

  return (
    <div style={widgetContainerStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData.points} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            angle={-30}
            textAnchor="end"
            height={60}
            label={
              chartData.xAxisLabel
                ? { value: chartData.xAxisLabel, position: 'insideBottom', offset: -5 }
                : undefined
            }
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={
              chartData.yAxisLabel
                ? { value: chartData.yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString(), 'Value']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
          />
          <Bar dataKey="value" radius={categoricalWidgetConfig.barRadius}>
            {chartData.points.map((point, index) => (
              <Cell key={`cell-${index}`} fill={point.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
