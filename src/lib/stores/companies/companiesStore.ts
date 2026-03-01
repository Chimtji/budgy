'use client';

import { create } from 'zustand';
import { showErrorNotification } from '@/notifications/feedback';
import { TServerResponse } from '@/service';
import { addCompany } from '@/service/database/companies/addCompany';
import { searchCompany } from '@/service/database/companies/searchCompany';

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
  add: (company: TCompanyDraft) => Promise<TServerResponse<TCompany>>;
  search: (query: string) => Promise<TServerResponse<TCompanies>>;
};

export type TCompaniesStore = TCompaniesState & TCompaniesStateActions;

export const useCompaniesStore = create<TCompaniesStore>()((set) => ({
  companies: {},
  search: (query: string) =>
    searchCompany(query).then((result) => {
      if (result.success) {
        console.info('✅ Successfully Searched Companies. Result: ' + result.data);
      } else {
        showErrorNotification({ title: 'Search Error', message: JSON.stringify(result.error) });
      }
      return result;
    }),
  add: (company) =>
    addCompany(company).then((result) => {
      if (result.success) {
        console.info('✅ Successfully Added Company');
      } else {
        showErrorNotification({ title: 'Add Error', message: JSON.stringify(result.error) });
      }
      return result;
    }),
}));
