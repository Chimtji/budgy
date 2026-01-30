'use server';

import type { TServerResponse } from '@/service';
import { addDbMatch, isDbAuthenticated } from '@/service/server';
import type { TTransaction } from '@/stores/transactions/transactionsStore';
import { db } from '../../database';

export const updateTransaction = async (
  id: string,
  transaction: TTransaction
): Promise<TServerResponse<null>> => {
  const authenticated = await isDbAuthenticated();
  if (!authenticated.success) {
    return authenticated;
  }

  if (transaction.date === null) {
    return { status: 401, error: 'Transaction update not allowed. Date was null', success: false };
  }

  try {
    const transactionRef = db
      .collection('users')
      .doc(authenticated.data.uid)
      .collection('transactions')
      .doc(id);

    await transactionRef.update({
      company: transaction.company,
      description: transaction.description,
      category: transaction.category,
      segment: transaction.segment,
    });

    await addDbMatch({
      description: transaction.description,
      category: transaction.category,
      segment: transaction.segment,
      company: transaction.company,
    });

    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, error, success: false };
  }
};
