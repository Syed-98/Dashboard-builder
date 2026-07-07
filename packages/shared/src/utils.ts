import type { HierarchicalNode } from './schemas.js';

export function calculateTreeDepth(node: HierarchicalNode, currentDepth = 1): number {
  if (!node.children || node.children.length === 0) {
    return currentDepth;
  }
  const childDepths = node.children.map((child) => calculateTreeDepth(child, currentDepth + 1));
  return Math.max(...childDepths);
}

export interface FlatTreeNode {
  name: string;
  value: number;
  depth: number;
  path: string;
}

export function flattenTree(
  node: HierarchicalNode,
  depth = 0,
  path = '',
): FlatTreeNode[] {
  const currentPath = path ? `${path}/${node.name}` : node.name;
  const result: FlatTreeNode[] = [
    { name: node.name, value: node.value, depth, path: currentPath },
  ];

  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child, depth + 1, currentPath));
    }
  }

  return result;
}

export function calculatePearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0 || n !== ys.length) {
    return 0;
  }

  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - meanX;
    const dy = (ys[i] ?? 0) - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

export function getCorrelationType(coefficient: number): 'positive' | 'negative' | 'none' {
  if (coefficient > 0.1) return 'positive';
  if (coefficient < -0.1) return 'negative';
  return 'none';
}

export function calculateTrend(
  points: Array<{ timestamp: string; value: number }>,
): { trendDirection: 'up' | 'down' | 'flat'; trendPercentage: number } {
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first || !last) {
    return { trendDirection: 'flat', trendPercentage: 0 };
  }

  const firstValue = first.value;
  const lastValue = last.value;

  if (firstValue === 0) {
    if (lastValue === 0) return { trendDirection: 'flat', trendPercentage: 0 };
    return { trendDirection: 'up', trendPercentage: 100 };
  }

  const percentage = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

  let trendDirection: 'up' | 'down' | 'flat';
  if (percentage > 1) {
    trendDirection = 'up';
  } else if (percentage < -1) {
    trendDirection = 'down';
  } else {
    trendDirection = 'flat';
  }

  return {
    trendDirection,
    trendPercentage: Math.round(percentage * 100) / 100,
  };
}
