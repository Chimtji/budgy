'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export const updateSubscriptionAmountRange = async (
  id: string,
  amountMin: number | null,
  amountMax: number | null
): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    await sqlClient`
      UPDATE subscription_matchers
      SET amount_min = ${amountMin}, amount_max = ${amountMax}
      WHERE id = ${id} AND user_id = ${auth.data.user.id}
    `;
    return { status: 200, success: true, data: undefined };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
