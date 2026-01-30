'use client';

import { FULL_DAY } from '@/service';
import { getDbTransactions } from '@/service/server';
import { useTransactionsStore } from '../transactionsStore';

export const init = async (storeName: string, set: any): Promise<void> => {
  let checkCache = true;

  // If the transactions is more than a day old, fetch new ones
  const lastFetch = useTransactionsStore.getState().lastFetch;
  if (Date.now() - lastFetch.valueOf() > FULL_DAY) {
    checkCache = false;
  }

  if (checkCache && typeof window !== undefined) {
    try {
      const cachedStore = localStorage.getItem(storeName);
      if (cachedStore) {
        const cachedTransactions = JSON.parse(cachedStore)?.state?.transactions;

        if (cachedTransactions && Object.keys(cachedTransactions).length > 0) {
          set({ transactions: cachedTransactions });
          return;
        }
      }
    } catch (error) {
      console.error(error);
      throw new Error('An error happened looking for cached transactionStore');
    }
  }

  const transactions = await getDbTransactions();

  if (!transactions.success) {
    console.error(transactions.error);
    throw new Error(transactions.error);
  }

  set({ transactions: transactions.data });
};
