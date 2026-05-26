'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export const deleteRule = async (id: string): Promise<TServerResponse<null>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      DELETE FROM categorization_rules
      WHERE id = ${id} AND user_id = ${auth.data.user.id}
      RETURNING id
    `;
    if (rows.length === 0) return { status: 404, success: false, error: 'Regel ikke fundet' };
    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
