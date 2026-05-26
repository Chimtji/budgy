'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TCompany } from './getAll';

export const upsertCompany = async (input: {
  name: string;
  pattern: string;
}): Promise<TServerResponse<TCompany>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const pattern = input.pattern.trim().toLowerCase();

  try {
    const id = randomUUID();
    const rows = await sqlClient`
      INSERT INTO companies (id, name, pattern, user_id)
      VALUES (${id}, ${input.name}, ${pattern}, ${auth.data.user.id})
      ON CONFLICT (user_id, pattern) DO UPDATE
        SET name = EXCLUDED.name
      RETURNING id, name, pattern, domain
    `;
    return { status: 200, success: true, data: rows[0] as TCompany };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
