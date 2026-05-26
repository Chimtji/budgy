'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TCategory } from './getAll';

type TUpdateInput = {
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};

export const updateCategory = async (input: TUpdateInput): Promise<TServerResponse<TCategory>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      UPDATE categories
      SET label = ${input.label}, color = ${input.color}, icon = ${input.icon}, description = ${input.description}
      WHERE key = ${input.key} AND user_id = ${auth.data.user.id}
      RETURNING id, key, label, color, icon, description
    `;

    if (rows.length === 0) return { status: 400, success: false, error: 'Kategori ikke fundet' };

    return { status: 200, success: true, data: rows[0] as TCategory };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
