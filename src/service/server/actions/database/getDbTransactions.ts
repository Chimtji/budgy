'use server';

import type { TServerResponse } from '@/service';
import { isDbAuthenticated } from '@/service/server';
import type { TTransaction } from '@/stores/transactions/transactionsStore';
import { makeSafeObject } from '@/utilities';
import { db } from '../../database';

type TTransactions = { [id: string]: TTransaction };

export const getDbTransactions = async (): Promise<TServerResponse<TTransactions>> => {
  const authenticated = await isDbAuthenticated();

  if (!authenticated.success) {
    return authenticated;
  }

  try {
    const transactionsRef = db
      .collection('users')
      .doc(authenticated.data.uid)
      .collection('transactions')
      .orderBy('date', 'desc');

    const snapshot = await transactionsRef.get();

    const result: TTransactions = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      result[doc.id] = makeSafeObject(data) as TTransaction;
    });

    return { status: 200, data: result, success: true };
  } catch (error: any) {
    if (error.code === 8) {
      return { status: 500, error: 'Could not fetch - Quota Exceeded', success: false };
    }
    return { status: 500, error, success: false };
  }
};
