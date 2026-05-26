import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type TState = {
  year: number;
};

type TActions = {
  setYear: (year: number) => void;
};

export const useAppStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        year: new Date().getFullYear(),

        setYear: (year) => {
          set((state) => {
            state.year = year;
          });
        },
      }))
    ),
    { name: 'app-store' }
  )
);
