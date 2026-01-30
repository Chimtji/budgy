import { addDbCompany, getDbCompanies } from '@/service/server';

export const addCompany = async (company: string, set: any): Promise<void> => {
  const added = await addDbCompany(company);

  if (!added.success) {
    console.error(added.error);
    throw new Error(added.error);
  }

  const companies = await getDbCompanies();
  if (!companies.success) {
    console.error(companies.error);
    throw new Error(companies.error);
  }

  set({ companies: companies.data });
};
