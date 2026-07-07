import { createElement, type ComponentType } from 'react';
import type { WidgetDefinition, WidgetProps, WidgetType } from '@dashboard-builder/shared';

type RegisteredWidgetDefinition = WidgetDefinition<Record<string, unknown>, unknown>;

class WidgetRegistryImpl {
  private definitions = new Map<WidgetType, RegisteredWidgetDefinition>();

  register(definition: RegisteredWidgetDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  get(type: WidgetType): RegisteredWidgetDefinition | undefined {
    return this.definitions.get(type);
  }

  has(type: WidgetType): boolean {
    return this.definitions.has(type);
  }

  getRegisteredTypes(): WidgetType[] {
    return Array.from(this.definitions.keys());
  }

  getWidgetMetadata(): Array<{
    type: WidgetType;
    displayName: string;
    defaultSize: { w: number; h: number; minW?: number; minH?: number };
  }> {
    return Array.from(this.definitions.values()).map((def) => ({
      type: def.type,
      displayName: def.displayName,
      defaultSize: def.defaultSize,
    }));
  }

  renderWidget(type: WidgetType, props: WidgetProps<unknown>): React.ReactNode | null {
    const definition = this.definitions.get(type);
    if (!definition) {
      return null;
    }
    return createElement(definition.component as ComponentType<WidgetProps<unknown>>, props);
  }

  clear(): void {
    this.definitions.clear();
  }
}

export const WidgetRegistry = new WidgetRegistryImpl();
