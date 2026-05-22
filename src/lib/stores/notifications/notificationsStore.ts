import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type TState = {
  dismissedIds: string[];
};

type TActions = {
  dismiss: (id: string) => void;
  dismissAll: (ids: string[]) => void;
};

export const useNotificationsStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        dismissedIds: [],

        dismiss: (id) => {
          set((state) => {
            if (!state.dismissedIds.includes(id)) {
              state.dismissedIds.push(id);
            }
          });
        },

        dismissAll: (ids) => {
          set((state) => {
            for (const id of ids) {
              if (!state.dismissedIds.includes(id)) {
                state.dismissedIds.push(id);
              }
            }
          });
        },
      }))
    ),
    { name: 'notifications-store' }
  )
);
