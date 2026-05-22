'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

type TUpsertInput = {
  pattern: string;
  category_key: string;
  segment_key: string;
  company_id?: string | null;
};

export const upsertRule = async (
  input: TUpsertInput
): Promise<TServerResponse<{ pattern: string }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const company_id = input.company_id ?? null;

  try {
    const id = randomUUID();
    await sqlClient`
      INSERT INTO categorization_rules (id, pattern, category_key, segment_key, company_id, user_id)
      VALUES (${id}, ${input.pattern}, ${input.category_key}, ${input.segment_key}, ${company_id}, ${auth.data.user.id})
      ON CONFLICT (user_id, pattern)
      DO UPDATE SET
        category_key = EXCLUDED.category_key,
        segment_key = EXCLUDED.segment_key,
        company_id = COALESCE(EXCLUDED.company_id, categorization_rules.company_id),
        match_count = categorization_rules.match_count + 1,
        updated_at = datetime('now')
    `;

    return { status: 200, success: true, data: { pattern: input.pattern } };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
