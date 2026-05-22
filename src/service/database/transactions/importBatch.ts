'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

type TImportRow = {
  date: string;
  amount: number;
  description: string;
  recipient: string;
  category_key: string;
  segment_key: string;
  company_id: string | null;
  balance?: number | null;
  supp_text?: string | null;
  auto_matched?: boolean;
};

export const importBatch = async (input: {
  transactions: TImportRow[];
}): Promise<TServerResponse<{ count: number }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    for (const tx of input.transactions) {
      await sqlClient`
        INSERT INTO transactions (id, date, amount, description, raw_description, recipient, company_id, category_key, segment_key, user_id)
        VALUES (
          ${randomUUID()},
          ${tx.date},
          ${tx.amount},
          ${tx.description},
          ${tx.description},
          ${tx.recipient},
          ${tx.company_id},
          ${tx.category_key},
          ${tx.segment_key},
          ${userId}
        )
      `;
    }

    return { status: 200, success: true, data: { count: input.transactions.length } };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
