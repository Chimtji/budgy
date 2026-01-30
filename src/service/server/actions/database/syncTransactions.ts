'use server';

import { type TServerResponse } from '@/service';
import { getBankTransactions, isFullAuthenticated } from '@/service/server';
import { isTransactionsFromSamePlace } from '@/stores/transactions/helpers';
import { db } from '../../database';
import { getDbMatches } from './getDbMatches';

/***
 * Fetches transactions from Bank API and adds the transactions to the firestore DB.
 */
export const syncTransactions = async (): Promise<TServerResponse<null>> => {
  const auth = await isFullAuthenticated();

  if (!auth.success) {
    return auth;
  }

  const transactions = await getBankTransactions();
  if (!transactions.success) {
    return transactions;
  }

  const matches = await getDbMatches();
  if (!matches.success) {
    return matches;
  }

  try {
    const batch = db.batch();
    const userId = auth.data.uid;
    const userTransactionsRef = db.collection('users').doc(userId).collection('transactions');

    Object.entries(transactions.data).forEach(([id, item]) => {
      const docRef = userTransactionsRef.doc(id);

      let company = item.company;
      let category = item.category;
      let segment = item.segment;

      const match = Object.entries(matches.data).find(([id, entry]) =>
        isTransactionsFromSamePlace(entry.description, item.description)
      );

      if (match) {
        company = match[1].company;
        category = match[1].category;
        segment = match[1].segment;
      }

      batch.set(docRef, {
        ...item,
        company,
        category,
        segment,
        createdAt: new Date(),
      });
    });

    await batch.commit();

    return { status: 200, data: null, success: true };
  } catch (error) {
    return { status: 500, error, success: false };
  }
};
