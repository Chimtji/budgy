'use server';

import { TCompany, TCompanyDraft } from '@/stores/companies/companiesStore';
import { TServerResponse } from '../../types';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export const addCompany = async (company: TCompanyDraft): Promise<TServerResponse<TCompany>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const [result] = await sqlClient`
      INSERT INTO companies (name, domain, description)
      VALUES (${company.name}, ${company.domain}, ${company.description})
      RETURNING id;
    `;

    const insertedCompany = {
      id: result.id,
      ...company,
    };

    return { status: 200, data: insertedCompany, success: true };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};
