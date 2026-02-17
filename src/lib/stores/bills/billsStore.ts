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
import { calculateMonthlyAmounts } from './billsStore.helpers';
import { TBillsStore } from './billsStore.types';

const STORE_NAME = 'bills-store';

export const useBillsStore = create<TBillsStore>()(
  subscribeWithSelector(
    persist<TBillsStore>(
      (set) => ({
        bills: {},
        average: 0,
        highest: 0,
        lowest: 0,
        total: 0,
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
      }),
      { name: STORE_NAME } satisfies PersistOptions<TBillsStore>
    )
  )
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;

    const amounts = calculateMonthlyAmounts(bills[year]);

    const highest = Math.max(...Object.values(amounts).map((amount) => amount));

    useBillsStore.setState({ highest } as unknown as Partial<TBillsStore>);
  }
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    let total = 0;

    const year = useAppStore.getState().year;
    const amounts = calculateMonthlyAmounts(bills[year]);

    Object.values(amounts).forEach((amount) => {
      total += amount;
    });

    useBillsStore.setState({ total: Math.floor(total) } as unknown as Partial<TBillsStore>);
  }
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;
    const amounts = calculateMonthlyAmounts(bills[year]);

    const lowest = Math.min(...Object.values(amounts).map((amount) => amount));

    useBillsStore.setState({ lowest } as unknown as Partial<TBillsStore>);
  }
);

useBillsStore.subscribe(
  (state) => state.bills,
  (bills) => {
    const year = useAppStore.getState().year;
    const monthlyAmounts = calculateMonthlyAmounts(bills[year]);
    const amounts = Object.values(monthlyAmounts);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    useBillsStore.setState({ average: Math.floor(average) } as unknown as Partial<TBillsStore>);
  }
);
