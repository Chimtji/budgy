'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TServerResponse } from '@/service/types';

export type TFingerprint = { date: string; amount: number; description: string };

export const getTransactionFingerprints = async (): Promise<TServerResponse<TFingerprint[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const uid = auth.data.user.id;

  try {
    const rows = await sqlClient`
      SELECT date, amount, description FROM transactions WHERE user_id = ${uid}
    `;
    return { status: 200, success: true, data: rows as TFingerprint[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
