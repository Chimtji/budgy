'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TSegment } from './create';

type TUpdateInput = {
  id: string;
  label: string;
  description: string;
};

export const updateSegment = async (input: TUpdateInput): Promise<TServerResponse<TSegment>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      UPDATE segments
      SET label = ${input.label}, description = ${input.description}
      WHERE id = ${input.id} AND user_id = ${auth.data.user.id}
      RETURNING id, key, category_key, label, description
    `;

    if (rows.length === 0) return { status: 400, success: false, error: 'Segment ikke fundet' };

    return { status: 200, success: true, data: rows[0] as TSegment };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
