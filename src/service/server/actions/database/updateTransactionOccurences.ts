'use server';

import type { TServerResponse } from '@/service';
import { addDbMatch, isDbAuthenticated } from '@/service/server';
import type { TTransaction } from '@/stores/transactions/transactionsStore';
import { db } from '../../database';

export const updateTransactionOccurences = async (
  transaction: TTransaction,
  occurences: string[]
): Promise<TServerResponse<null>> => {
  const authenticated = await isDbAuthenticated();
  if (!authenticated.success) {
    return authenticated;
  }

  if (transaction.date === null) {
    return { status: 401, error: 'Transaction update not allowed. Date was null', success: false };
  }

  const sharedOccurenceData: Omit<TTransaction, 'amount' | 'date' | 'currency'> = {
    description: transaction.description,
    company: transaction.company,
    category: transaction.category,
    segment: transaction.segment,
  };

  try {
    const batch = db.batch();

    for (const occ of occurences) {
      const transactionRef = db
        .collection('users')
        .doc(authenticated.data.uid)
        .collection('transactions')
        .doc(occ);

      batch.update(transactionRef, sharedOccurenceData);
    }

    await batch.commit();

    await addDbMatch({
      description: sharedOccurenceData.description,
      company: sharedOccurenceData.company,
      category: sharedOccurenceData.category,
      segment: sharedOccurenceData.segment,
    });

    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, error: error, success: false };
  }
};
