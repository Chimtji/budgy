'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export const updateRule = async (
  id: string,
  pattern: string,
  category_key: string,
  segment_key: string,
  company_id?: string | null
): Promise<TServerResponse<null>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const resolvedCompanyId = company_id ?? null;

  try {
    const rows = await sqlClient`
      UPDATE categorization_rules
      SET pattern = ${pattern}, category_key = ${category_key}, segment_key = ${segment_key},
          company_id = ${resolvedCompanyId}, updated_at = datetime('now')
      WHERE id = ${id} AND user_id = ${auth.data.user.id}
      RETURNING id
    `;
    if (rows.length === 0) return { status: 404, success: false, error: 'Regel ikke fundet' };
    return { status: 200, success: true, data: null };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
