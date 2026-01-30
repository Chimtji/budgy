'use client';

import { create } from 'zustand';
import { persist, PersistOptions, subscribeWithSelector } from 'zustand/middleware';
import { TCategoryName, TMonth, TSegmentName } from '@/data/types';
import { showErrorNotification } from '@/notifications/feedback';
import { addDbBill } from '@/service/server';
import { TCompany } from '../companies/companiesStore';
import { addBill } from './actions/addBill';
import { deleteBill } from './actions/deleteBill';
import { init } from './actions/init';

export type TBill = {
  due: TMonth[];
  company: TCompany;
  category: TCategoryName;
  segment: TSegmentName;
  amount: number;
};

export type TBills = { [id: string]: TBill };

export type TBillsState = {
  bills: TBills;
};

export type TBillsStateActions = {
  addBill: (bill: TBill) => void;
  editBill: () => void;
  deleteBill: (id: string) => void;
  init: () => void;
};

export type TBillsStore = TBillsState & TBillsStateActions;

const STORE_NAME = 'bills-store';

export const useBillsStore = create<TBillsStore>()(
  subscribeWithSelector(
    persist<TBillsStore>(
      (set) => ({
        bills: {},
        addBill: (bill) =>
          addBill(bill, set)
            .then(() => {
              console.info('✅ Successfully Added Bill');
            })
            .catch((error) => {
              showErrorNotification({ title: 'Add Bill Error', message: JSON.stringify(error) });
            }),
        editBill: () => {},
        deleteBill: (id: string) =>
          deleteBill(id, set)
            .then(() => {
              console.info('✅ Successfully Deleted Bill');
            })
            .catch((error) => {
              showErrorNotification({ title: 'Delete Bill Error', message: JSON.stringify(error) });
            }),
        init: () =>
          init(set)
            .then(() => {
              console.info('✅ Successfully Initiated Bills');
            })
            .catch((error) => {
              showErrorNotification({ title: 'Init Error', message: JSON.stringify(error) });
            }),
      }),
      { name: STORE_NAME } satisfies PersistOptions<TBillsStore>
    )
  )
);
