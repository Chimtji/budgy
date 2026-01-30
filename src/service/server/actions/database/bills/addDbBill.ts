'use server';

import { TBill } from '@/stores/bills/billsStore';
import { TServerResponse } from '../../../../types';
import { db } from '../../../database';
import { isDbAuthenticated } from '../isDbAuthenticated';

export const addDbBill = async (bill: TBill): Promise<TServerResponse<{ id: string }>> => {
  const auth = await isDbAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const userId = auth.data.uid;
    const userBillsRef = db.collection('users').doc(userId).collection('bills');
    const docRef = await userBillsRef.add({ ...bill, createdAt: new Date() });

    return { status: 200, success: true, data: { id: docRef.id } };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
