'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TGoal } from './getAll';

/**
 * Upsert a goal for a (category, segment) pair effective from a given month.
 * `effective_from` must be a YYYY-MM-01 string.
 * `segment_key` is '' for "alle segmenter".
 */
export const upsertGoal = async (input: {
  name: string;
  category_key: string;
  segment_key: string;
  amount_limit: number;
  effective_from: string;
}): Promise<TServerResponse<TGoal>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const id = randomUUID();
    const rows = await sqlClient`
      INSERT INTO goals (id, name, category_key, segment_key, amount_limit, effective_from, user_id)
      VALUES (${id}, ${input.name}, ${input.category_key}, ${input.segment_key}, ${input.amount_limit}, ${input.effective_from}, ${auth.data.user.id})
      ON CONFLICT(user_id, category_key, segment_key, effective_from)
        DO UPDATE SET name = excluded.name, amount_limit = excluded.amount_limit
      RETURNING id, name, category_key, segment_key, amount_limit, effective_from
    `;

    return { status: 200, success: true, data: rows[0] as TGoal };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
