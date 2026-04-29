'use server';

import { TServerResponse } from '@/service/types';

// CSV import replaces bank sync - users upload CSVs from their bank instead
export const syncTransactionsFromBank = async (): Promise<
  TServerResponse<{ imported: number; errors: number }>
> => {
  return {
    status: 400,
    success: false,
    error: 'Use CSV import instead - upload bank statements directly',
  };
};
