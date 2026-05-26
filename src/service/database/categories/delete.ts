'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export const deleteCategory = async (key: string): Promise<TServerResponse<{ key: string }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    await sqlClient`
      DELETE FROM categories
      WHERE key = ${key} AND user_id = ${auth.data.user.id}
    `;

    return { status: 200, success: true, data: { key } };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
