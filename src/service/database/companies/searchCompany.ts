'use server';

import { TCompanies, TCompany } from '@/stores/companies/companiesStore';
import { TServerResponse } from '../../types';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export const searchCompany = async (search: string): Promise<TServerResponse<TCompanies>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const match = await sqlClient`
      SELECT * FROM companies WHERE name ILIKE ${'%' + search + '%'} OR domain ILIKE ${'%' + search + '%'} LIMIT 7;
    `;

    const result: TCompanies = {};
    match.forEach((company) => {
      result[company.id] = company as TCompany;
    });

    return { status: 200, data: result, success: true };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};
