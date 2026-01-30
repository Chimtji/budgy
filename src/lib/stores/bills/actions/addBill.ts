import { addDbBill, addDbCompany, getDbBills, getDbCompanies } from '@/service/server';
import { TBill } from '../billsStore';

export const addBill = async (bill: TBill, set: any): Promise<void> => {
  const added = await addDbBill(bill);

  if (!added.success) {
    console.error(added.error);
    throw new Error(added.error);
  }

  const bills = await getDbBills();
  if (!bills.success) {
    console.error(bills.error);
    throw new Error(bills.error);
  }

  set({ bills: bills.data });
};
