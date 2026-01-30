import { deleteDbBill, getDbBills } from '@/service/server';

export const deleteBill = async (id: string, set: any): Promise<void> => {
  const deleted = await deleteDbBill(id);

  if (!deleted.success) {
    console.error(deleted.error);
    throw new Error(deleted.error);
  }

  const bills = await getDbBills();
  if (!bills.success) {
    console.error(bills.error);
    throw new Error(bills.error);
  }

  set({ bills: bills.data });
};
