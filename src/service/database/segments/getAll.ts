'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { segmentsSnapshot } from '@/service/database/snapshot';

export type TSegment = {
  id: string;
  key: string;
  category_key: string;
  label: string;
  description: string;
};

export const getAllSegments = async (): Promise<TServerResponse<TSegment[]>> => {
  if (process.env.READ_ONLY === 'true') {
    return { status: 200, success: true, data: segmentsSnapshot as TSegment[] };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, key, category_key, label, description
      FROM segments
      WHERE user_id = ${auth.data.user.id}
      ORDER BY label ASC
    `;

    return { status: 200, success: true, data: rows as TSegment[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
