'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { TServerResponse } from '@/service/types';

export const getBudgetsForYear = async (year: number): Promise<TServerResponse<any[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  return {
    status: 200,
    success: true,
    data: [],
  };
};
