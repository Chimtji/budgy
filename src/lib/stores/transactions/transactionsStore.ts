import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { showErrorNotification } from '@/notifications/feedback';
import { archiveTransaction } from '@/service/database/transactions/archive';
import { deleteTransaction } from '@/service/database/transactions/delete';
import { getAllTransactions, type TTransaction } from '@/service/database/transactions/getAll';
import { unarchiveTransaction } from '@/service/database/transactions/unarchive';
import { updateTransaction } from '@/service/database/transactions/update';

type TFilters = {
  year?: number;
  category_key?: string;
  showArchived?: boolean;
};

type TState = {
  transactions: TTransaction[];
  isLoading: boolean;
  filters: TFilters;
};

type TActions = {
  init: (filters?: TFilters) => Promise<void>;
  setFilters: (filters: TFilters) => void;
  updateTransaction: (input: {
    id: string;
    date: string;
    amount: number;
    description: string;
    recipient: string;
    category_key: string;
    segment_key: string;
    company_name: string | null;
  }) => Promise<void>;
  archiveTransaction: (id: string) => Promise<void>;
  unarchiveTransaction: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
};

export const useTransactionsStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        transactions: [],
        isLoading: false,
        filters: {},

        init: async (filters) => {
          set((state) => {
            state.isLoading = true;
            if (filters) state.filters = filters;
          });

          const result = await getAllTransactions(filters ?? get().filters);

          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke hente transaktioner' });
            set((state) => {
              state.isLoading = false;
            });
            return;
          }

          set((state) => {
            state.transactions = result.data;
            state.isLoading = false;
          });
        },

        setFilters: (filters) => {
          set((state) => {
            state.filters = filters;
          });
        },

        updateTransaction: async (input) => {
          const result = await updateTransaction(input);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere transaktion' });
            return;
          }
          set((state) => {
            const idx = state.transactions.findIndex((t) => t.id === input.id);
            if (idx !== -1) state.transactions[idx] = result.data;
          });
        },

        archiveTransaction: async (id) => {
          const result = await archiveTransaction(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke arkivere transaktion' });
            return;
          }
          set((state) => {
            const idx = state.transactions.findIndex((t) => t.id === id);
            if (idx !== -1) state.transactions[idx].is_archived = 1;
          });
        },

        unarchiveTransaction: async (id) => {
          const result = await unarchiveTransaction(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke gendanne transaktion' });
            return;
          }
          set((state) => {
            const idx = state.transactions.findIndex((t) => t.id === id);
            if (idx !== -1) state.transactions[idx].is_archived = 0;
          });
        },

        deleteTransaction: async (id) => {
          const result = await deleteTransaction(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette transaktion' });
            return;
          }
          set((state) => {
            state.transactions = state.transactions.filter((t) => t.id !== id);
          });
        },
      }))
    ),
    { name: 'transactions-store' }
  )
);
