'use server';

import { TServerResponse } from '../../../../types';
import { db } from '../../../database';
import { isDbAuthenticated } from '../isDbAuthenticated';

export const deleteDbBill = async (billId: string): Promise<TServerResponse<null>> => {
  const auth = await isDbAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const userId = auth.data.uid;
    const billRef = db.collection('users').doc(userId).collection('bills').doc(billId);

    await billRef.delete();

    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
