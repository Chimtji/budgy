'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import { showErrorNotification } from '@/notifications/feedback';
import { deleteAccess, isDbAuthenticated } from '@/service/server';
import { useTransactionsStore } from '../transactions/transactionsStore';

export type TUserState = { loggedIn: boolean; fullAuthenticated: boolean };

export type TUserStateActions = {
  login: () => void;
  authenticate: () => void;
  deleteStore: () => void;
  deleteAllAccess: () => Promise<void>;
};

export type TUserStore = TUserState & TUserStateActions;

const STORE_NAME = 'user-store';

export const useUserStore = create<TUserStore>()(
  subscribeWithSelector(
    persist<TUserStore>(
      (set) => ({
        loggedIn: false,
        fullAuthenticated: false,
        deleteStore: () => {
          set(
            produce((state) => {
              state.authenticated = false;
            })
          );
          localStorage.removeItem(STORE_NAME);
        },
        deleteAllAccess: async () => {
          deleteAccess()
            .then((response) => {
              useTransactionsStore.getState().deleteStore();

              set(
                produce<TUserState>((state) => {
                  state.loggedIn = false;
                })
              );
              localStorage.removeItem(STORE_NAME);
            })
            .catch((error) => {
              showErrorNotification({ title: 'Auth Error', message: JSON.stringify(error) });
            });
        },
        login: async () => {
          isDbAuthenticated()
            .then((response) => {
              if (!response.success) {
                set(
                  produce<TUserState>((state) => {
                    state.loggedIn = false;
                  })
                );
              } else {
                set(
                  produce<TUserState>((state) => {
                    state.loggedIn = true;
                  })
                );
              }
            })
            .catch((error) => {
              set(
                produce<TUserState>((state) => {
                  state.loggedIn = false;
                })
              );
            });
        },
        authenticate: () =>
          set(
            produce<TUserState>((state) => {
              state.fullAuthenticated = true;
            })
          ),
      }),
      { name: STORE_NAME } satisfies PersistOptions<TUserStore>
    )
  )
);
