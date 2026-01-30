'use client';

import { deepEqual } from '@/utilities';
import { TTransaction, useTransactionsStore } from '../transactionsStore';

export const getIdOfTransaction = async (transaction: TTransaction): Promise<string> => {
  try {
    const transactions = useTransactionsStore.getState().transactions;
    const match: any = Object.entries(transactions).find(([id, item]) =>
      deepEqual(item, transaction)
    );
    if (!match) {
      throw new Error('Could not get ID of transaction');
    }
    return match[0];
  } catch (error) {
    console.error(error);
    throw new Error('An error happened finding id');
  }
};
