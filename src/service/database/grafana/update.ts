'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TDashboard } from './getAll';

type TUpdateInput = {
  id: string;
  name: string;
  url: string;
};

export const updateDashboard = async (
  input: TUpdateInput
): Promise<TServerResponse<TDashboard>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      UPDATE grafana_dashboards
      SET name = ${input.name}, url = ${input.url}
      WHERE id = ${input.id} AND user_id = ${auth.data.user.id}
      RETURNING id, name, url, position
    `;

    if (rows.length === 0) return { status: 400, success: false, error: 'Dashboard ikke fundet' };

    return { status: 200, success: true, data: rows[0] as TDashboard };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
