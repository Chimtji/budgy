'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { categoriesSnapshot } from '@/service/database/snapshot';

export type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};

export const getAllCategories = async (): Promise<TServerResponse<TCategory[]>> => {
  if (process.env.READ_ONLY === 'true') {
    return { status: 200, success: true, data: categoriesSnapshot as TCategory[] };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, key, label, color, icon, description
      FROM categories
      WHERE user_id = ${auth.data.user.id}
      ORDER BY label ASC
    `;

    return { status: 200, success: true, data: rows as TCategory[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
