'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import { showErrorNotification } from '@/notifications/feedback';
import { addBill } from '@/service/database/bills/addBill';
import { deleteBill } from '@/service/database/bills/deleteBill';
import { editBill } from '@/service/database/bills/editBill';
import { getAllOfYear } from '@/service/database/bills/getAll';
import { useAppStore } from '../app/appStore';
import { DEFAULT_STATE } from './billsStore.defaults';
import { calculateMonthlyExpenses } from './billsStore.helpers';
import { TBillsStore } from './billsStore.types';

const STORE_NAME = 'bills-store';

export const useBillsStore = create<TBillsStore>()(
  subscribeWithSelector(
    persist<TBillsStore>(
      (set) => ({
        ...DEFAULT_STATE,
        add: (bill) =>
          addBill(bill).then((result) => {
            if (result.success) {
              const year = useAppStore.getState().year;
              set(
                produce((state: TBillsStore) => {
                  state.bills[year][result.data.id.toString()] = bill;
                })
              );
            } else {
              showErrorNotification({
                title: 'Add Bill Error',
                message: result.error,
              });
            }
          }),
        edit: (bill, id) =>
          editBill(bill, id).then((result) => {
            if (result.success) {
              const year = useAppStore.getState().year;
              set(
                produce((state: TBillsStore) => {
                  state.bills[year][result.data.id.toString()] = bill;
                })
              );
            } else {
              showErrorNotification({
                title: 'Edit Bill Error',
                message: result.error,
              });
            }
          }),
        delete: (id) =>
          deleteBill(id).then((result) => {
            if (result.success) {
              const year = useAppStore.getState().year;
              set(
                produce((state: TBillsStore) => {
                  delete state.bills[year][id];
                })
              );
            } else {
              showErrorNotification({
                title: 'Delete Bill Error',
                message: result.error,
              });
            }
          }),
        getAllOfYear: (year) => {
          const state = useBillsStore.getState();

          console.log('Fetching bills for year');

          const billsOfYear = state?.bills?.[year];
          if (billsOfYear && Object.keys(billsOfYear).length > 0) {
            return; // Bills already fetched
          }

          return getAllOfYear(year).then((result) => {
            if (result.success) {
              set(
                produce((state) => {
                  state.bills[year] = result.data;
                })
              );
            } else {
              showErrorNotification({ title: 'Fetch Bills Error', message: result.error });
            }
          });
        },
        clean: async () => {
          set(
            produce((state: TBillsStore) => {
              Object.assign(state, DEFAULT_STATE);
            })
          );

          console.log('done cleaning bills');
          return Promise.resolve();
        },
      }),
      { name: STORE_NAME } satisfies PersistOptions<TBillsStore>
    )
  )
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;

    const expenses = calculateMonthlyExpenses(bills[year]);

    const highest = Math.max(...Object.values(expenses).map((amount) => amount));

    useBillsStore.setState(
      produce((state) => {
        state.highest = highest;
      })
    );
  }
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;
    const expenses = calculateMonthlyExpenses(bills[year]);

    const total = Object.values(expenses).reduce((sum, e) => sum + e, 0);

    useBillsStore.setState(
      produce((state) => {
        state.total = Math.floor(total);
      })
    );
  }
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;
    const expenses = calculateMonthlyExpenses(bills[year]);

    const lowest = Math.min(...Object.values(expenses).map((amount) => amount));

    useBillsStore.setState(
      produce((state) => {
        state.lowest = lowest;
      })
    );
  }
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;
    const expenses = Object.values(calculateMonthlyExpenses(bills[year]));
    const totalMonths = expenses.length;

    const total = expenses.reduce((sum, e) => sum + e, 0);
    const average = Math.ceil(total / totalMonths);

    // Calculate max deficit if we pay expenses BEFORE receiving transfers
    let balance = 0;
    let minBalance = 0;

    for (const expense of expenses) {
      balance -= expense; // Pay expense first
      minBalance = Math.min(minBalance, balance);
      balance += average; // Then receive transfer
    }

    const startTransfer = Math.ceil(-minBalance);

    useBillsStore.setState(
      produce((state) => {
        state.transferPlan = {
          monthly: average,
          start: startTransfer,
        };
      })
    );
  }
);
