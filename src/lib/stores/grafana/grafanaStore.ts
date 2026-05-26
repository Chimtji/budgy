import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { showErrorNotification } from '@/notifications/feedback';
import { createDashboard } from '@/service/database/grafana/create';
import { deleteDashboard } from '@/service/database/grafana/delete';
import { getAllDashboards, type TDashboard } from '@/service/database/grafana/getAll';
import { updateDashboard } from '@/service/database/grafana/update';

type TState = {
  dashboards: TDashboard[];
};

type TActions = {
  init: () => Promise<void>;
  addDashboard: (data: { name: string; url: string }) => Promise<void>;
  updateDashboard: (data: { id: string; name: string; url: string }) => Promise<void>;
  removeDashboard: (id: string) => Promise<void>;
};

export const useGrafanaStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        dashboards: [],

        init: async () => {
          const result = await getAllDashboards();
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke hente dashboards' });
            return;
          }
          set((state) => {
            state.dashboards = result.data;
          });
        },

        addDashboard: async (data) => {
          const result = await createDashboard(data);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke oprette dashboard' });
            return;
          }
          set((state) => {
            state.dashboards.push(result.data);
          });
        },

        updateDashboard: async (data) => {
          const result = await updateDashboard(data);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere dashboard' });
            return;
          }
          set((state) => {
            const idx = state.dashboards.findIndex((d) => d.id === data.id);
            if (idx !== -1) state.dashboards[idx] = result.data;
          });
        },

        removeDashboard: async (id) => {
          const result = await deleteDashboard(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette dashboard' });
            return;
          }
          set((state) => {
            state.dashboards = state.dashboards.filter((d) => d.id !== id);
          });
        },
      }))
    ),
    { name: 'grafana-store' }
  )
);
