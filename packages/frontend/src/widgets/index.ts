import { WidgetRegistry } from '../engine/registry';
import { categoricalWidgetDefinition } from './categorical';
import { temporalWidgetDefinition } from './temporal';
import { hierarchicalWidgetDefinition } from './hierarchical';
import { relationalWidgetDefinition } from './relational';

WidgetRegistry.register(categoricalWidgetDefinition);
WidgetRegistry.register(temporalWidgetDefinition);
WidgetRegistry.register(hierarchicalWidgetDefinition);
WidgetRegistry.register(relationalWidgetDefinition);
