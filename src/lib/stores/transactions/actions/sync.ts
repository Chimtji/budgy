'use client';

import { getDbTransactions, syncTransactions } from '@/service/server';

export const sync = async (set: any): Promise<void> => {
  // @TODO: Right now we just fetch all transactions and save them to DB.
  // We should probably update so it only fetches transactions newer than the newest date in DB.
  const added = await syncTransactions();

  if (!added.success) {
    console.error(added.error);
    throw new Error(added.error);
  }

  const transactions = await getDbTransactions();
  if (!transactions.success) {
    console.error(transactions.error);
    throw new Error(transactions.error);
  }

  set({ transactions: transactions.data });
};
