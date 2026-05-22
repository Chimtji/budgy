'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export type TSegment = {
  id: string;
  key: string;
  category_key: string;
  label: string;
  description: string;
};

type TCreateInput = {
  key: string;
  category_key: string;
  label: string;
  description: string;
};

export const createSegment = async (input: TCreateInput): Promise<TServerResponse<TSegment>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const id = randomUUID();
    const rows = await sqlClient`
      INSERT INTO segments (id, key, category_key, label, description, user_id)
      VALUES (${id}, ${input.key}, ${input.category_key}, ${input.label}, ${input.description}, ${auth.data.user.id})
      RETURNING id, key, category_key, label, description
    `;

    return { status: 200, success: true, data: rows[0] as TSegment };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
