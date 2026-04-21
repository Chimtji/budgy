'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import { useBillsStore } from '../bills/billsStore';
import { TAppStore } from './appStore.types';

const STORE_NAME = 'app-store';

export const useAppStore = create<TAppStore>()(
  subscribeWithSelector(
    persist<TAppStore>(
      (set) => ({
        year: new Date().getFullYear(),
        userId: null,
        setYear: (year: number) => {
          set(
            produce((state) => {
              state.year = year;
            })
          );
        },
        setUserId: (userId: string | null) => {
          set(
            produce((state) => {
              state.userId = userId;
            })
          );
        },
        cleanData: async () => {
          await useBillsStore.getState().clean();
          return Promise.resolve();
        },
      }),
      { name: STORE_NAME } satisfies PersistOptions<TAppStore>
    )
  )
);

useAppStore.subscribe(
  (state) => state.year,
  (year) => {
    useBillsStore.getState().getAllOfYear(year);
  }
);
