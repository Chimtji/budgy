'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TSubscriptionMatcher } from './getAll';

type TCreateInput = {
  name: string;
  matcher_type: TSubscriptionMatcher['matcher_type'];
  matcher_value: string;
  cadence?: TSubscriptionMatcher['cadence'];
  amount_min?: number | null;
  amount_max?: number | null;
};

export const createSubscriptionMatcher = async (
  input: TCreateInput
): Promise<TServerResponse<TSubscriptionMatcher>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const id = randomUUID();
    const rows = await sqlClient`
      INSERT INTO subscription_matchers (id, name, matcher_type, matcher_value, cadence, amount_min, amount_max, user_id)
      VALUES (${id}, ${input.name}, ${input.matcher_type}, ${input.matcher_value}, ${input.cadence ?? null}, ${input.amount_min ?? null}, ${input.amount_max ?? null}, ${auth.data.user.id})
      RETURNING id, name, matcher_type, matcher_value, cadence, amount_min, amount_max, created_at
    `;
    return { status: 200, success: true, data: rows[0] as TSubscriptionMatcher };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
