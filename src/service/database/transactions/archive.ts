'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export const archiveTransaction = async (id: string): Promise<TServerResponse<null>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const rows = await sqlClient`
      UPDATE transactions SET archived = 1
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (rows.length === 0) return { status: 400, success: false, error: 'Transaktion ikke fundet' };

    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
