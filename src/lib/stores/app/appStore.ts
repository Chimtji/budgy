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
        setYear: (year: number) => {
          set(
            produce((state) => {
              state.year = year;
            })
          );
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
