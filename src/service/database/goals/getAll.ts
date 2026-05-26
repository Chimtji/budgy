'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export type TGoal = {
  id: string;
  name: string;
  category_key: string;
  /** Empty string means "alle segmenter" */
  segment_key: string;
  amount_limit: number;
  effective_from: string; // YYYY-MM-DD, always the 1st of a month
};

/** Returns all goal entries for the user (full history across all categories). */
export const getAllGoals = async (): Promise<TServerResponse<TGoal[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, name, category_key, segment_key, amount_limit, effective_from
      FROM goals
      WHERE user_id = ${auth.data.user.id}
      ORDER BY category_key ASC, segment_key ASC, effective_from ASC
    `;

    return { status: 200, success: true, data: rows as TGoal[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
