import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { showErrorNotification } from '@/notifications/feedback';
import { createCompany } from '@/service/database/companies/create';
import { deleteCompany } from '@/service/database/companies/delete';
import { getAllCompanies, type TCompany } from '@/service/database/companies/getAll';
import { updateCompany } from '@/service/database/companies/update';

type TState = {
  companies: TCompany[];
};

type TActions = {
  init: () => Promise<void>;
  addCompany: (
    name: string,
    domain?: string | null,
    tags?: string[],
    category_key?: string | null,
    segment_key?: string | null
  ) => Promise<TCompany | null>;
  updateCompany: (
    id: string,
    name: string,
    domain?: string | null,
    tags?: string[],
    category_key?: string | null,
    segment_key?: string | null
  ) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
};

export const useCompaniesStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        companies: [],

        init: async () => {
          const result = await getAllCompanies();
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke hente virksomheder' });
            return;
          }
          set((state) => {
            state.companies = result.data;
          });
        },

        addCompany: async (name, domain, tags, category_key, segment_key) => {
          const result = await createCompany({ name, domain, tags, category_key, segment_key });
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke oprette virksomhed' });
            return null;
          }
          set((state) => {
            state.companies.push(result.data);
            state.companies.sort((a, b) => a.name.localeCompare(b.name));
          });
          return result.data;
        },

        updateCompany: async (id, name, domain, tags, category_key, segment_key) => {
          const result = await updateCompany({ id, name, domain, tags, category_key, segment_key });
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere virksomhed' });
            return;
          }
          set((state) => {
            const idx = state.companies.findIndex((c) => c.id === id);
            if (idx !== -1) state.companies[idx] = result.data;
          });
        },

        removeCompany: async (id) => {
          const result = await deleteCompany(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette virksomhed' });
            return;
          }
          set((state) => {
            state.companies = state.companies.filter((c) => c.id !== id);
          });
        },
      }))
    ),
    { name: 'companies-store' }
  )
);
