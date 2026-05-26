'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export type TSubscriptionMatcher = {
  id: string;
  name: string;
  matcher_type: 'description_prefix' | 'description_contains' | 'company';
  matcher_value: string;
  cadence: 'monthly' | 'bi-monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'irregular' | null;
  amount_min: number | null;
  amount_max: number | null;
  note: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export const getAllSubscriptionMatchers = async (): Promise<
  TServerResponse<TSubscriptionMatcher[]>
> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, name, matcher_type, matcher_value, cadence, amount_min, amount_max, note, cancelled_at, created_at
      FROM subscription_matchers
      WHERE user_id = ${auth.data.user.id}
      ORDER BY created_at ASC
    `;
    return { status: 200, success: true, data: rows as TSubscriptionMatcher[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
