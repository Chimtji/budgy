'use client';

import { TTransactions, useTransactionsStore } from '../transactionsStore';

export const searchTransactions = async (query: string): Promise<TTransactions> => {
  try {
    const transactions = useTransactionsStore.getState().transactions;
    const lowerQuery = query.toLowerCase();

    const filtered = Object.entries(transactions).reduce<TTransactions>(
      (result, [id, transaction]) => {
        if (transaction.description.toLowerCase().includes(lowerQuery)) {
          result[id] = transaction;
        }
        return result;
      },
      {}
    );

    return filtered;
  } catch (error) {
    console.error(error);
    throw new Error('an error happened searching transactions');
  }
};
