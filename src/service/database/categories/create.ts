'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TCategory } from './getAll';

type TCreateInput = {
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};

export const createCategory = async (input: TCreateInput): Promise<TServerResponse<TCategory>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const id = randomUUID();
    const rows = await sqlClient`
      INSERT INTO categories (id, key, label, color, icon, description, user_id)
      VALUES (${id}, ${input.key}, ${input.label}, ${input.color}, ${input.icon}, ${input.description}, ${auth.data.user.id})
      RETURNING id, key, label, color, icon, description
    `;

    return { status: 200, success: true, data: rows[0] as TCategory };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
