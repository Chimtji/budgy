'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

type TBulkUpdateInput = {
  ids: string[];
  category_key: string;
  segment_key: string;
  company_name: string | null;
};

export const bulkUpdateTransactions = async (
  input: TBulkUpdateInput
): Promise<TServerResponse<{ updated: number }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    for (const id of input.ids) {
      await sqlClient`
        UPDATE transactions
        SET category_key = ${input.category_key},
            segment_key  = ${input.segment_key}
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (input.company_name?.trim()) {
        await sqlClient`
          UPDATE transactions
          SET company_id = (SELECT id FROM companies WHERE name = ${input.company_name.trim()} AND user_id = ${userId} LIMIT 1)
          WHERE id = ${id} AND user_id = ${userId}
        `;
      } else {
        await sqlClient`
          UPDATE transactions SET company_id = NULL WHERE id = ${id} AND user_id = ${userId}
        `;
      }
    }

    return { status: 200, success: true, data: { updated: input.ids.length } };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
