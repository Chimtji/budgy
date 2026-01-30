'use server';

import { TBill } from '@/stores/bills/billsStore';
import { TServerResponse } from '../../../../types';
import { db } from '../../../database';
import { isDbAuthenticated } from '../isDbAuthenticated';

export const updateDbBill = async (id: string, bill: TBill): Promise<TServerResponse<null>> => {
  const auth = await isDbAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const userId = auth.data.uid;

    if (!id) {
      return { status: 400, success: false, error: 'Missing bill ID' };
    }

    const billRef = db.collection('users').doc(userId).collection('bills').doc(id);

    await billRef.update(bill);

    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
