import { addDbCompany, getDbCompanies } from '@/service/server';

export const init = async (set: any): Promise<void> => {
  const companies = await getDbCompanies();
  if (!companies.success) {
    console.error(companies.error);
    throw new Error(companies.error);
  }

  set({ companies: companies.data });
};
