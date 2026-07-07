import type { WidgetType } from '@dashboard-builder/shared';

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateLatency(rng: SeededRandom): Promise<void> {
  const latency = rng.nextInt(50, 250);
  await delay(latency);
}

export class MockDataEngine {
  private rng: SeededRandom;

  constructor(seed = 42) {
    this.rng = new SeededRandom(seed);
  }

  async generate(widgetType: WidgetType, widgetId: string): Promise<unknown> {
    await simulateLatency(this.rng);

    switch (widgetType) {
      case 'categorical':
        return this.generateCategorical();
      case 'temporal':
        return this.generateTemporal();
      case 'hierarchical':
        return this.generateHierarchical();
      case 'relational':
        return this.generateRelational();
      default:
        throw new Error(`Unknown widget type: ${widgetType as string}`);
    }
  }

  private generateCategorical() {
    const categories = [
      'Electronics',
      'Clothing',
      'Food & Beverage',
      'Home & Garden',
      'Sports',
      'Books',
    ];

    return {
      points: categories.map((label) => ({
        label,
        value: Math.round(this.rng.nextFloat(10000, 100000)),
        category: label,
      })),
      metadata: {
        xAxisLabel: 'Product Category',
        yAxisLabel: 'Revenue ($)',
      },
    };
  }

  private generateTemporal() {
    const points = [];
    const now = new Date();
    const baseValue = 1000;
    const trendSlope = 5;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayIndex = 29 - i;
      const trendValue = baseValue + trendSlope * dayIndex;
      const noise = this.rng.nextFloat(-50, 50);
      const value = Math.round(trendValue + noise);
      const boundRange = this.rng.nextFloat(30, 80);

      points.push({
        timestamp: date.toISOString(),
        value,
        upperBound: Math.round(value + boundRange),
        lowerBound: Math.round(value - boundRange),
      });
    }

    return {
      points,
      granularity: 'day' as const,
      metadata: {
        unit: 'requests',
        trendDirection: 'up' as const,
        trendPercentage: 14.7,
      },
    };
  }

  private generateHierarchical() {
    const departments = [
      {
        name: 'Engineering',
        teams: ['Frontend', 'Backend', 'DevOps', 'QA'],
      },
      {
        name: 'Sales',
        teams: ['Enterprise', 'SMB', 'Partnerships'],
      },
      {
        name: 'Marketing',
        teams: ['Digital', 'Content', 'Events'],
      },
      {
        name: 'Operations',
        teams: ['HR', 'Finance', 'Legal'],
      },
    ];

    const rootChildren = departments.map((dept) => {
      const deptValue = Math.round(this.rng.nextFloat(500000, 2000000));
      const teamValue = Math.floor(deptValue / dept.teams.length);

      return {
        name: dept.name,
        value: deptValue,
        children: dept.teams.map((team) => ({
          name: team,
          value: teamValue + Math.round(this.rng.nextFloat(-50000, 50000)),
          children: [
            {
              name: `${team} Lead`,
              value: Math.round(teamValue * 0.3),
            },
            {
              name: `${team} Staff`,
              value: Math.round(teamValue * 0.7),
            },
          ],
        })),
      };
    });

    const totalValue = rootChildren.reduce((sum, child) => sum + child.value, 0);

    return {
      root: {
        name: 'Acme Corporation',
        value: totalValue,
        children: rootChildren,
      },
      totalValue,
      depth: 3,
    };
  }

  private generateRelational() {
    const categories = ['Campaign A', 'Campaign B', 'Campaign C', 'Campaign D'];
    const points = [];
    const slope = 0.8;

    for (let i = 0; i < 50; i++) {
      const category = categories[this.rng.nextInt(0, categories.length - 1)] ?? 'Campaign A';
      const x = this.rng.nextFloat(1000, 50000);
      const noise = this.rng.nextFloat(-5000, 5000);
      const y = slope * x + this.rng.nextFloat(1000, 5000) + noise;

      points.push({
        id: `point-${i + 1}`,
        x: Math.round(x),
        y: Math.round(y),
        size: this.rng.nextInt(20, 100),
        category,
        label: `${category} #${i + 1}`,
      });
    }

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);

    return {
      points,
      axes: {
        xLabel: 'Marketing Spend ($)',
        yLabel: 'Revenue ($)',
        xRange: [Math.min(...xs), Math.max(...xs)] as [number, number],
        yRange: [Math.min(...ys), Math.max(...ys)] as [number, number],
      },
      correlation: {
        coefficient: 0.85,
        type: 'positive' as const,
      },
    };
  }
}
