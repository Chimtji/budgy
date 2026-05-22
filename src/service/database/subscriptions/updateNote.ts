'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export const updateSubscriptionNote = async (
  id: string,
  note: string | null
): Promise<TServerResponse<null>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    await sqlClient`
      UPDATE subscription_matchers
      SET note = ${note}
      WHERE id = ${id} AND user_id = ${auth.data.user.id}
    `;
    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
