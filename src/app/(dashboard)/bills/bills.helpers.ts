import months from '@/data/months.json';
import { TMonth } from '@/data/types';
import { TBills } from '@/stores/bills/billsStore';

export type TSummary = { month: TMonth; amount: number }[];

export const summarizeBillsByMonth = (bills: TBills): TSummary => {
  const countMap = new Map<TMonth, number>();

  Object.values(bills).forEach((bill) => {
    console.log(bill);
    bill.due.forEach((month) => {
      countMap.set(month, (countMap.get(month) ?? 0) + 1);
    });
  });

  return Object.keys(months).map((month) => ({
    month: month as TMonth,
    amount: countMap.get(month as TMonth) ?? 0,
  }));
};

export const getMonthWithHighestAmount = (summary: TSummary) => {
  if (summary.length === 0) return null;

  const highest = summary.reduce((max, current) => (current.amount > max.amount ? current : max));

  return highest;
};
