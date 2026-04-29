'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getTransactionsByMonth, TransactionData } from '@/service/database/transactions';

interface TransactionState {
  transactions: Map<string, TransactionData>;
  isLoading: boolean;
  filters: {
    category?: string;
    segment?: string;
    startAmount?: number;
    endAmount?: number;
  };
  actions: {
    add: (transaction: TransactionData) => void;
    update: (id: string, updates: Partial<TransactionData>) => void;
    fetchByMonth: (year: number, month: number) => Promise<void>;
    setFilter: (filter: Partial<TransactionState['filters']>) => void;
    clearFilter: () => void;
  };
}

export const useTransactionsStore = create<TransactionState>()(
  persist(
    immer((set) => ({
      transactions: new Map(),
      isLoading: false,
      filters: {},
      actions: {
        add: (transaction) =>
          set((state) => {
            state.transactions.set(transaction.id, transaction);
          }),
        update: (id, updates) =>
          set((state) => {
            const tx = state.transactions.get(id);
            if (tx) Object.assign(tx, updates);
          }),
        fetchByMonth: async (year, month) => {
          set((state) => {
            state.isLoading = true;
          });
          const result = await getTransactionsByMonth(year, month);
          set((state) => {
            if (result.success) {
              result.data.forEach((tx: TransactionData) => state.transactions.set(tx.id, tx));
            }
            state.isLoading = false;
          });
        },
        setFilter: (filter) =>
          set((state) => {
            state.filters = { ...state.filters, ...filter };
          }),
        clearFilter: () =>
          set((state) => {
            state.filters = {};
          }),
      },
    })),
    {
      name: 'transactions-store',
      version: 1,
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

export const useTransactionsByMonth = (year: number, month: number) => {
  const transactions = useTransactionsStore((state) => state.transactions);

  return useMemo(() => {
    return Array.from(transactions.values())
      .filter((tx) => {
        const txDate = new Date(tx.transactionDate);
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === month;
      })
      .sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
  }, [transactions, year, month]);
};
