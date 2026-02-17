'use client';

import { create } from 'zustand';
import { showErrorNotification } from '@/notifications/feedback';
import { addCompany } from '@/service/database/companies/addCompany';
import { init } from './actions/init';

export type TCompanyDraft = {
  name: string;
  domain: string;
  description: string;
};

export type TCompany = {
  name: string;
  domain: string;
  description: string;
  id: number;
};

export type TCompanies = {
  [id: string]: TCompany;
};

export type TCompaniesState = {
  companies: TCompanies;
};

export type TCompaniesStateActions = {
  initCompanies: () => void;
  addCompany: (company: TCompany) => void;
};

export type TCompaniesStore = TCompaniesState & TCompaniesStateActions;

export const useCompaniesStore = create<TCompaniesStore>()((set) => ({
  companies: {},
  addCompany: (company) =>
    addCompany(company)
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
