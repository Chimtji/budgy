'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { dashboardsSnapshot } from '@/service/database/snapshot';

export type TDashboard = {
  id: string;
  name: string;
  url: string;
  position: number;
};

export const getAllDashboards = async (): Promise<TServerResponse<TDashboard[]>> => {
  if (process.env.READ_ONLY === 'true') {
    return { status: 200, success: true, data: dashboardsSnapshot as TDashboard[] };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, name, url, position
      FROM grafana_dashboards
      WHERE user_id = ${auth.data.user.id}
      ORDER BY position ASC
    `;

    return { status: 200, success: true, data: rows as TDashboard[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
