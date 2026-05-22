'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TRule } from '@/service/categorization/engine';

export type TRuleRow = TRule & { id: string; updated_at: string; company_id: string | null };

export const getAllRules = async (): Promise<TServerResponse<TRule[]>> => {
  if (process.env.READ_ONLY === 'true') {
    return { status: 200, success: true, data: [] };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT pattern, category_key, segment_key, match_count, company_id
      FROM categorization_rules
      WHERE user_id = ${auth.data.user.id}
    `;
    return { status: 200, success: true, data: rows as TRule[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};

export const getAllRuleRows = async (): Promise<TServerResponse<TRuleRow[]>> => {
  if (process.env.READ_ONLY === 'true') {
    return { status: 200, success: true, data: [] };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, pattern, category_key, segment_key, match_count, company_id, updated_at
      FROM categorization_rules
      WHERE user_id = ${auth.data.user.id}
      ORDER BY match_count DESC, updated_at DESC
    `;
    return { status: 200, success: true, data: rows as TRuleRow[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
