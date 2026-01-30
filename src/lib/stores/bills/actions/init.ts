import { getDbBills } from '@/service/server';

export const init = async (set: any): Promise<void> => {
  const bills = await getDbBills();
  if (!bills.success) {
    console.error(bills.error);
    throw new Error(bills.error);
  }

  set({ bills: bills.data });
};
