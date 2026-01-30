'use client';

import { create } from 'zustand';
import { showErrorNotification } from '@/notifications/feedback';
import { type TTimestamp } from '@/service';
import { addCompany } from './actions/addCompany';
import { init } from './actions/init';

export type TCompany = string;

export type TCompaniesState = {
  companies: { [id: string]: { label: TCompany; createdAt: TTimestamp } };
};

export type TCompaniesStateActions = {
  initCompanies: () => void;
  addCompany: (company: string) => void;
};

export type TCompaniesStore = TCompaniesState & TCompaniesStateActions;

export const useCompaniesStore = create<TCompaniesStore>()((set) => ({
  companies: {},
  addCompany: (company: string) =>
    addCompany(company, set)
      .then(() => {
        console.info('✅ Successfully Added Company');
      })
      .catch((error) => {
        showErrorNotification({ title: 'Add Error', message: JSON.stringify(error) });
      }),
  initCompanies: () =>
    init(set)
      .then(() => {
        console.info('✅ Successfully Initiated Companies');
      })
      .catch((error) => {
        showErrorNotification({ title: 'Init Error', message: JSON.stringify(error) });
      }),
}));
