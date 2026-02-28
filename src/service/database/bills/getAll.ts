'use server';

import { TServerResponse } from '@/service';
import { TBill, TBills } from '@/stores/bills/billsStore.types';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export const getAllOfYear = async (year: number): Promise<TServerResponse<TBills>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const result = await sqlClient`
        SELECT 
          bills.*,
          companies.name as company_name,
          companies.domain as company_domain
        FROM bills
        INNER JOIN companies ON bills.company_id = companies.id
        WHERE bills.user_id = ${auth.data.user.id} 
          AND bills.year = ${year}
      `;

    const bills = {} as TBills;

    result.forEach((bill) => {
      bills[bill.id.toString()] = {
        id: bill.id,
        category: bill.category,
        segment: bill.segment,
        companyId: bill.company_id,
        companyName: bill.company_name,
        companyDomain: bill.company_domain,
        amount: parseFloat(bill.amount),
        due: JSON.parse(bill.due) as TBill['due'],
        year: bill.year,
        name: bill.name,
      } as TBill;
    });

    return { status: 200, success: true, data: bills };
  } catch (error) {
    return {
      status: 500,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
