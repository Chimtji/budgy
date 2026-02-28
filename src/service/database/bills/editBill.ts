'use server';

import { TBill } from '@/stores/bills/billsStore.types';
import { TServerResponse } from '../../types';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export const editBill = async (
  bill: TBill,
  id: number
): Promise<TServerResponse<TBill & { id: number }>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    await sqlClient`
      UPDATE bills
      SET amount = ${bill.amount}, company_id = ${bill.companyId}, category = ${bill.category}, segment = ${bill.segment}, due = ${JSON.stringify(bill.due)}, year = ${bill.year}, name = ${bill.name}
      WHERE id = ${id} AND user_id = ${auth.data.user.id}
      RETURNING id;
    `;

    const updatedBill = {
      id,
      ...bill,
    };

    return { status: 200, data: updatedBill, success: true };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};
