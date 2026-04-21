'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import { showErrorNotification } from '@/notifications/feedback';
import { getCategories } from '@/service/database/categories/getCategories';
import { DEFAULT_STATE } from './categoriesStore.defaults';
import { TCategoriesStore } from './categoriesStore.types';

const STORE_NAME = 'categories-store';

export const useCategoriesStore = create<TCategoriesStore>()(
  subscribeWithSelector(
    persist<TCategoriesStore>(
      (set) => ({
        ...DEFAULT_STATE,
        getAll: () => {
          const state = useCategoriesStore.getState();

          // Return early if already loaded
          if (state.loaded) {
            return;
          }

          set(
            produce((state: TCategoriesStore) => {
              state.loading = true;
            })
          );

          return getCategories().then((result) => {
            if (result.success) {
              set(
                produce((state) => {
                  state.categories = result.data;
                  state.loading = false;
                  state.loaded = true;
                })
              );
            } else {
              set(
                produce((state) => {
                  state.loading = false;
                })
              );
              showErrorNotification({
                title: 'Fetch Categories Error',
                message: result.error,
              });
            }
          });
        },
        clean: async () => {
          set(
            produce((state: TCategoriesStore) => {
              Object.assign(state, DEFAULT_STATE);
            })
          );

          return Promise.resolve();
        },
      }),
      { name: STORE_NAME } satisfies PersistOptions<TCategoriesStore>
    )
  )
);
