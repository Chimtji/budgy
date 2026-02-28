'use server';

import { TBill } from '@/stores/bills/billsStore.types';
import { TServerResponse } from '../../types';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export const addBill = async (bill: TBill): Promise<TServerResponse<TBill & { id: number }>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const [result] = await sqlClient`
      INSERT INTO bills (amount, company_id, category, segment, due, user_id, year, name)
      VALUES (${bill.amount}, ${bill.companyId}, ${bill.category}, ${bill.segment}, ${JSON.stringify(bill.due)}, ${auth.data.user.id}, ${bill.year}, ${bill.name})
      RETURNING id;
    `;

    const insertedBill = {
      id: result.id,
      ...bill,
    };

    return { status: 200, data: insertedBill, success: true };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};
