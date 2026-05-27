import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type TState = {
  year: number;
  isReadOnly: boolean;
};

type TActions = {
  setYear: (year: number) => void;
  setReadOnly: (value: boolean) => void;
};

export const useAppStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        year: new Date().getFullYear(),
        isReadOnly: false,

        setYear: (year) => {
          set((state) => {
            state.year = year;
          });
        },

        setReadOnly: (value) => {
          set((state) => {
            state.isReadOnly = value;
          });
        },
      }))
    ),
    { name: 'app-store', partialize: (state) => ({ year: state.year }) }
  )
);
