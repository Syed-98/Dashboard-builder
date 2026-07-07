import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WidgetConfig, WidgetType } from '@dashboard-builder/shared';
import { WidgetRegistry } from './registry';
import {
  initialState,
  createWidgetId,
  createDefaultWidgetState,
  getDefaultLayoutForType,
  type DashboardState,
  type GridLayout,
  DEFAULT_WIDGET_CONFIGS,
  DEFAULT_LAYOUTS,
} from './types';

interface DashboardActions {
  addWidget: (type: WidgetType) => string;
  removeWidget: (widgetId: string) => void;
  updateWidgetConfig: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  updateLayouts: (layouts: GridLayout[]) => void;
  setWidgetData: (widgetId: string, data: unknown) => void;
  setWidgetLoading: (widgetId: string, isLoading: boolean) => void;
  setWidgetError: (widgetId: string, error: string | null) => void;
  selectWidget: (widgetId: string | null) => void;
  toggleEditMode: () => void;
  renameDashboard: (name: string) => void;
  resetDashboard: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addWidget: (type: WidgetType) => {
        const definition = WidgetRegistry.get(type);
        if (!definition) {
          throw new Error(`Widget type "${type}" is not registered`);
        }

        const widgetId = createWidgetId();
        const config: WidgetConfig = {
          id: widgetId,
          type,
          title: definition.displayName,
          refreshInterval: 5000,
          ...definition.defaultConfig,
        };

        const layout = getDefaultLayoutForType(widgetId, type, get().layouts);

        set((state) => ({
          widgetConfigs: { ...state.widgetConfigs, [widgetId]: config },
          layouts: [...state.layouts, layout],
          widgetStates: {
            ...state.widgetStates,
            [widgetId]: createDefaultWidgetState(),
          },
          selectedWidgetId: widgetId,
        }));

        return widgetId;
      },

      removeWidget: (widgetId: string) => {
        set((state) => {
          const { [widgetId]: _removedConfig, ...widgetConfigs } = state.widgetConfigs;
          const { [widgetId]: _removedState, ...widgetStates } = state.widgetStates;
          return {
            widgetConfigs,
            widgetStates,
            layouts: state.layouts.filter((l) => l.i !== widgetId),
            selectedWidgetId:
              state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
          };
        });
      },

      updateWidgetConfig: (widgetId: string, updates: Partial<WidgetConfig>) => {
        set((state) => {
          const existing = state.widgetConfigs[widgetId];
          if (!existing) return state;
          return {
            widgetConfigs: {
              ...state.widgetConfigs,
              [widgetId]: { ...existing, ...updates },
            },
          };
        });
      },

      updateLayouts: (layouts: GridLayout[]) => {
        set({ layouts });
      },

      setWidgetData: (widgetId: string, data: unknown) => {
        set((state) => ({
          widgetStates: {
            ...state.widgetStates,
            [widgetId]: {
              ...(state.widgetStates[widgetId] ?? createDefaultWidgetState()),
              data,
              isLoading: false,
              error: null,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      setWidgetLoading: (widgetId: string, isLoading: boolean) => {
        set((state) => ({
          widgetStates: {
            ...state.widgetStates,
            [widgetId]: {
              ...(state.widgetStates[widgetId] ?? createDefaultWidgetState()),
              isLoading,
            },
          },
        }));
      },

      setWidgetError: (widgetId: string, error: string | null) => {
        set((state) => ({
          widgetStates: {
            ...state.widgetStates,
            [widgetId]: {
              ...(state.widgetStates[widgetId] ?? createDefaultWidgetState()),
              error,
              isLoading: false,
            },
          },
        }));
      },

      selectWidget: (widgetId: string | null) => {
        set({ selectedWidgetId: widgetId });
      },

      toggleEditMode: () => {
        set((state) => ({ isEditMode: !state.isEditMode }));
      },

      renameDashboard: (name: string) => {
        set({ dashboardName: name });
      },

      resetDashboard: () => {
        set({
          ...initialState,
          widgetConfigs: { ...DEFAULT_WIDGET_CONFIGS },
          layouts: [...DEFAULT_LAYOUTS],
          widgetStates: {},
        });
      },
    }),
    {
      name: 'dashboard-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dashboardId: state.dashboardId,
        dashboardName: state.dashboardName,
        widgetConfigs: state.widgetConfigs,
        layouts: state.layouts,
        isEditMode: state.isEditMode,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          console.warn('Dashboard state corrupted or outdated, resetting to default.');
          localStorage.removeItem('dashboard-storage');
          useDashboardStore.setState({
            ...initialState,
            widgetConfigs: { ...DEFAULT_WIDGET_CONFIGS },
            layouts: [...DEFAULT_LAYOUTS],
          });
        }
      },
    },
  ),
);
