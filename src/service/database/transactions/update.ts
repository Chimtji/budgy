'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TTransaction } from './getAll';

type TUpdateInput = {
  id: string;
  date: string;
  amount: number;
  description: string;
  recipient: string;
  category_key: string;
  segment_key: string;
  company_name: string | null;
};

export const updateTransaction = async (
  input: TUpdateInput
): Promise<TServerResponse<TTransaction>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    await sqlClient`
      UPDATE transactions
      SET date = ${input.date},
          amount = ${input.amount},
          description = ${input.description},
          recipient = ${input.recipient},
          category_key = ${input.category_key},
          segment_key = ${input.segment_key}
      WHERE id = ${input.id} AND user_id = ${userId}
    `;

    if (input.company_name?.trim()) {
      await sqlClient`
        UPDATE transactions
        SET company_id = (SELECT id FROM companies WHERE name = ${input.company_name.trim()} AND user_id = ${userId} LIMIT 1)
        WHERE id = ${input.id} AND user_id = ${userId}
      `;
    } else {
      await sqlClient`
        UPDATE transactions SET company_id = NULL WHERE id = ${input.id} AND user_id = ${userId}
      `;
    }

    const rows = await sqlClient`
      SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
             t.category_key, t.segment_key, t.imported_at,
             c.name AS company_name, c.domain AS company_domain
      FROM transactions t
      LEFT JOIN companies c ON c.id = t.company_id
      WHERE t.id = ${input.id} AND t.user_id = ${userId}
    `;

    if (rows.length === 0) return { status: 400, success: false, error: 'Transaktion ikke fundet' };

    const tx = rows[0] as TTransaction;

    if (input.category_key) {
      await sqlClient`
        INSERT INTO categorization_rules (id, pattern, category_key, segment_key, user_id)
        VALUES (${randomUUID()}, ${tx.raw_description}, ${input.category_key}, ${input.segment_key}, ${userId})
        ON CONFLICT (user_id, pattern)
        DO UPDATE SET
          category_key = EXCLUDED.category_key,
          segment_key = EXCLUDED.segment_key,
          match_count = categorization_rules.match_count + 1,
          updated_at = datetime('now')
      `;
    }

    return { status: 200, success: true, data: tx };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
