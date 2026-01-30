'use client';

import { produce } from 'immer';
import { updateTransaction } from '@/service/server';
import { SetState, TTransaction, TTransactionsStore } from '../transactionsStore';

export const editSingle = async (
  id: string,
  updatedTransaction: TTransaction,
  set: SetState<TTransactionsStore>
): Promise<void> => {
  const update = await updateTransaction(id, updatedTransaction);
  if (!update.success) {
    console.error(update.error);
    throw new Error(update.error);
  }

  set(
    produce((state) => {
      state.transactions[id] = updatedTransaction;
    })
  );
};
