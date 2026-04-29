'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { TServerResponse } from '@/service/types';

export const upsertBudgetsForYear = async (
  year: number,
  budgets: any[]
): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  return {
    status: 200,
    success: true,
    data: undefined,
  };
};
