'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import { showErrorNotification } from '@/notifications/feedback';
import { getBudgetsForYear } from '@/service/database/budgets/getBudgetsForYear';
import { upsertBudgetsForYear } from '@/service/database/budgets/upsertBudgetsForYear';
import { DEFAULT_STATE } from './budgetsStore.defaults';
import { TBudgetsStore } from './budgetsStore.types';

const STORE_NAME = 'budgets-store';

const getCellKey = (categoryId: string, segmentId: string, month: number): string => {
  return `${categoryId}-${segmentId}-${month}`;
};

export const useBudgetsStore = create<TBudgetsStore>()(
  subscribeWithSelector(
    persist<TBudgetsStore>(
      (set, get) => ({
        ...DEFAULT_STATE,
        getAll: async (year: number) => {
          const state = get();

          // Return early if already loaded for this year
          if (state.loaded && state.year === year) {
            return;
          }

          set(
            produce((state: TBudgetsStore) => {
              state.loading = true;
            })
          );

          const result = await getBudgetsForYear(year);

          if (result.success) {
            const budgetMap = new Map<string, number>();

            result.data.forEach((budget) => {
              const key = getCellKey(budget.categoryId, budget.segmentId, budget.month);
              budgetMap.set(key, budget.amount);
            });

            set(
              produce((state) => {
                state.budgets = budgetMap;
                state.year = year;
                state.loading = false;
                state.loaded = true;
                state.dirty.clear();
              })
            );
          } else {
            set(
              produce((state) => {
                state.loading = false;
              })
            );
            showErrorNotification({
              title: 'Fetch Budgets Error',
              message: result.error,
            });
          }
        },
        updateCell: (categoryId: string, segmentId: string, month: number, amount: number) => {
          set(
            produce((state: TBudgetsStore) => {
              const key = getCellKey(categoryId, segmentId, month);
              state.budgets.set(key, amount);
              state.dirty.add(key);
            })
          );
        },
        saveAll: async () => {
          const state = get();

          if (state.dirty.size === 0) {
            return; // Nothing to save
          }

          const budgetsToSave = Array.from(state.dirty).map((key) => {
            const [categoryId, segmentId, month] = key.split('-');
            const amount = state.budgets.get(key) || 0;
            return {
              categoryId,
              segmentId,
              year: state.year,
              month: parseInt(month),
              amount,
            };
          });

          const result = await upsertBudgetsForYear(budgetsToSave);

          if (result.success) {
            set(
              produce((state) => {
                state.dirty.clear();
              })
            );
          } else {
            showErrorNotification({
              title: 'Save Budgets Error',
              message: result.error,
            });
          }
        },
        setYear: (year: number) => {
          set(
            produce((state: TBudgetsStore) => {
              state.year = year;
            })
          );
        },
        clean: async () => {
          set(
            produce((state: TBudgetsStore) => {
              Object.assign(state, DEFAULT_STATE);
            })
          );

          return Promise.resolve();
        },
      }),
      { name: STORE_NAME } satisfies PersistOptions<TBudgetsStore>
    )
  )
);
