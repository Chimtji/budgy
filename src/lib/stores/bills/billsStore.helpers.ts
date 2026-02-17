import { TBills } from './billsStore.types';

export const groupBillsByMonth = (bills: TBills) => {
  const grouped: { [month: string]: TBills } = {};

  for (const id in bills) {
    const bill = bills[id];
    if (bill) {
      bill.due.forEach((value) => {
        const month = value;

        if (!grouped[month]) {
          grouped[month] = {};
        }

        grouped[month][id] = bill;
      });
    }
  }

  return grouped;
};

export const calculateMonthlyAmounts = (bills: TBills) => {
  const grouped = groupBillsByMonth(bills);
  const amounts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  Object.keys(grouped).forEach((month) => {
    const monthBills = grouped[month];

    Object.keys(monthBills).forEach((id) => {
      const bill = monthBills[id];
      amounts[parseInt(month) as keyof typeof amounts] += bill.amount;
    });
  });

  return amounts;
};
