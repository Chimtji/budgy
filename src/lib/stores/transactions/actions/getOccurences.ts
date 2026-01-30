'use client';

import { isTransactionsFromSamePlace } from '../helpers';
import { TTransaction, useTransactionsStore } from '../transactionsStore';

export const getOccurences = async (base: TTransaction): Promise<string[]> => {
  try {
    const transactions = useTransactionsStore.getState().transactions;

    if (!base) {
      return [];
    }

    const result = Object.entries(transactions)
      .map(([id, entry]) => {
        if (isTransactionsFromSamePlace(entry.description, base.description)) {
          return id;
        }
        return null;
      })
      .filter((x) => x !== null);

    return result;
  } catch (error) {
    console.error(error);
    throw new Error('Could not get occurences');
  }
};
