import { memo, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { WidgetProps, HierarchicalData } from '@dashboard-builder/shared';
import { dataTransformers } from '@dashboard-builder/shared';
import { WidgetLoading, WidgetError, WidgetEmpty, widgetContainerStyle } from '../common/WidgetStates';
import { DEPTH_COLORS, hierarchicalWidgetConfig } from './config';

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  depth?: number;
}

function CustomTreemapContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name = '',
  value = 0,
  depth = 0,
}: TreemapContentProps) {
  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length] ?? '#8884d8';
  const showLabel =
    width > hierarchicalWidgetConfig.minCellSize &&
    height > hierarchicalWidgetConfig.minCellSize;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
          >
            {value.toLocaleString()}
          </text>
        </>
      )}
    </g>
  );
}

interface TreemapNode {
  name: string;
  value: number;
  depth: number;
  children?: TreemapNode[];
}

function toTreemapData(node: TreemapNode): TreemapNode {
  if (!node.children || node.children.length === 0) {
    return { name: node.name, value: node.value, depth: node.depth };
  }
  return {
    name: node.name,
    value: node.value,
    depth: node.depth,
    children: node.children.map(toTreemapData),
  };
}

export const HierarchicalWidget = memo(function HierarchicalWidget({
  data,
  isLoading,
  error,
}: WidgetProps<HierarchicalData | null>) {
  const chartData = useMemo(() => {
    if (!data) return null;
    return dataTransformers.hierarchical.toChartFormat(data);
  }, [data]);

  if (isLoading) return <WidgetLoading />;
  if (error) return <WidgetError message={error} />;
  if (!chartData) return <WidgetEmpty />;

  const treemapData = [toTreemapData(chartData.root)];

  return (
    <div style={widgetContainerStyle}>
      <div className="widget-header-extra">
        <span className="widget-meta">
          Total: {chartData.totalValue.toLocaleString()} | Depth: {chartData.depth}
        </span>
      </div>
      <ResponsiveContainer width="100%" height="calc(100% - 24px)">
        <Treemap
          data={treemapData}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<CustomTreemapContent />}
        >
          <Tooltip
            formatter={(value: number) => [value.toLocaleString(), 'Value']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
});
