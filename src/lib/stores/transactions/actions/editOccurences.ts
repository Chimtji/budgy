'use client';

import { produce } from 'immer';
import { getDbTransactions, updateTransactionOccurences } from '@/service/server';
import {
  SetState,
  TTransaction,
  TTransactionsStore,
  useTransactionsStore,
} from '../transactionsStore';

export const editOccurences = async (
  updatedTransaction: TTransaction,
  occurences: string[],
  set: SetState<TTransactionsStore>
): Promise<void> => {
  const updateOccurences = await updateTransactionOccurences(updatedTransaction, occurences);
  if (!updateOccurences.success) {
    console.error(updateOccurences.error);
    throw new Error(updateOccurences.error);
  }

  const updatedTransactions = await getDbTransactions();
  if (!updatedTransactions.success) {
    console.error(updatedTransactions.error);
    throw new Error(updatedTransactions.error);
  }

  const currentTransactions = useTransactionsStore.getState().transactions;

  Object.entries(currentTransactions).forEach(([id, current]) => {
    if (
      current.category !== updatedTransactions.data[id].category ||
      current.segment !== updatedTransactions.data[id].segment ||
      current.company !== updatedTransactions.data[id].company
    ) {
      set(
        produce<TTransactionsStore>((state) => {
          state.transactions[id] = updatedTransactions.data[id];
        })
      );
    }
  });
};
