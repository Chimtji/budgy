'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import type { TCategoryName, TSegmentName } from '@/data/types';
import { showErrorNotification, showWarningNotification } from '@/notifications/feedback';
import { type TTimestamp } from '@/service';
import { editOccurences } from './actions/editOccurences';
import { editSingle } from './actions/editSingle';
import { getIdOfTransaction } from './actions/getIdOfTransaction';
import { getOccurences } from './actions/getOccurences';
import { init } from './actions/init';
import { searchTransactions } from './actions/searchTransactions';
import { sync } from './actions/sync';

export type TTransaction = {
  company: string;
  amount: number;
  description: string;
  date: TTimestamp;
  category: TCategoryName;
  segment: TSegmentName;
  currency: string;
};

export type TTransactions = { [id: string]: TTransaction };

export type TTransactionsState = {
  transactions: TTransactions;
  pendingTransactions: TTransactions;
  lastFetch: Date;
};

export type TTransactionsStateActions = {
  initTransactions: () => Promise<void>;
  syncTransactions: () => Promise<void>;
  editTransaction: (id: string, transaction: TTransaction) => Promise<void>;
  editTransactionOccurences: (transaction: TTransaction, occurences: string[]) => Promise<void>;
  deleteStore: () => void;
  searchTransactions: (search: string) => Promise<TTransactions>;
  getOccurences: (base: TTransaction) => Promise<string[]>;
  getIdOfTransaction: (transaction: TTransaction) => Promise<string>;
};

export type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
export type TTransactionsStore = TTransactionsState & TTransactionsStateActions;

const STORE_NAME = 'transaction-store';

export const useTransactionsStore = create<TTransactionsStore>()(
  subscribeWithSelector(
    persist<TTransactionsStore>(
      (set) => ({
        transactions: {},
        pendingTransactions: {},
        lastFetch: new Date(),
        deleteStore: () => {
          set(
            produce((state) => {
              state.transactions = {};
            })
          );
          localStorage.removeItem(STORE_NAME);
        },
        initTransactions: async () =>
          init(STORE_NAME, set)
            .then(() => {
              console.info('✅ Successfully Initiated Transactions');
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Init Error', message: error.message });
            }),
        syncTransactions: async () =>
          sync(set)
            .then(() => {
              console.info('✅ Successfully Synced Transactions');
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Sync Error', message: error.message });
            }),
        editTransaction: async (id, updatedTransaction) =>
          editSingle(id, updatedTransaction, set)
            .then(() => {
              console.info('✅ Successfully Edited Transaction');
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Edit Error', message: error.message });
            }),
        editTransactionOccurences: async (transaction, occurences) =>
          editOccurences(transaction, occurences, set)
            .then(() => {
              console.info('✅ Successfully Edited All Occurences');
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Edit Error', message: error.message });
            }),
        searchTransactions: async (search: string) =>
          searchTransactions(search)
            .then((response) => {
              console.info('✅ Successfully Searched Transactions');
              return response;
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Search Error', message: error.message });
              return {};
            }),
        getOccurences: async (base) =>
          getOccurences(base)
            .then((response) => {
              console.info('✅ Successfully Fetched Occurences');
              return response;
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Get Error', message: error.message });
              return [];
            }),
        getIdOfTransaction: async (transaction) =>
          getIdOfTransaction(transaction)
            .then((response) => {
              console.info('✅ Successfully Got ID of Transaction');
              return response;
            })
            .catch((error: Error) => {
              showErrorNotification({ title: 'Get Error', message: error.message });
              return '';
            }),
      }),
      { name: STORE_NAME } satisfies PersistOptions<TTransactionsStore>
    )
  )
);

useTransactionsStore.subscribe(
  (state) => state.transactions,
  (transactions) => {
    const filtered = Object.entries(transactions).reduce<TTransactions>(
      (result, [id, transaction]) => {
        if (transaction.category === 'uncategorized' || transaction.segment === 'uncategorized') {
          result[id] = transaction;
        }
        return result;
      },
      {}
    );

    if (Object.keys(filtered).length > 0) {
      // If we don't add a timeout the notification will start on the page and not slide in.
      setTimeout(
        () =>
          showWarningNotification({
            title: `Transactions Need Attention`,
            message: `We found ${filtered.length} that needs a category or segment. We can't include them in the budget before this is resolved`,
          }),
        1000
      );
    }

    useTransactionsStore.setState({ pendingTransactions: filtered });
  }
);
