'use server';

import { TBill, TBills } from '@/stores/bills/billsStore';
import { makeSafeObject } from '@/utilities';
import { TServerResponse } from '../../../../types';
import { db } from '../../../database';
import { isDbAuthenticated } from '../isDbAuthenticated';

export const getDbBills = async (): Promise<TServerResponse<TBills>> => {
  const auth = await isDbAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const userId = auth.data.uid;
    const userBillsRef = db
      .collection('users')
      .doc(userId)
      .collection('bills')
      .orderBy('createdAt', 'desc');

    const snapshot = await userBillsRef.get();

    const result: TBills = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      result[doc.id] = makeSafeObject(data) as TBill;
    });

    return { status: 200, success: true, data: result };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
