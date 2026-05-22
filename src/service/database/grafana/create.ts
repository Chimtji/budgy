'use server';

import { randomUUID } from 'crypto';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TDashboard } from './getAll';

type TCreateInput = {
  name: string;
  url: string;
};

export const createDashboard = async (
  input: TCreateInput
): Promise<TServerResponse<TDashboard>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const maxRows = await sqlClient`
      SELECT COALESCE(MAX(position), -1) AS max_position
      FROM grafana_dashboards
      WHERE user_id = ${userId}
    `;

    const nextPosition = (maxRows[0].max_position as number) + 1;
    const id = randomUUID();

    const rows = await sqlClient`
      INSERT INTO grafana_dashboards (id, name, url, position, user_id)
      VALUES (${id}, ${input.name}, ${input.url}, ${nextPosition}, ${userId})
      RETURNING id, name, url, position
    `;

    return { status: 200, success: true, data: rows[0] as TDashboard };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
