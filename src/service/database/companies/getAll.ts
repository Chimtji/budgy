'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export type TCompany = {
  id: string;
  name: string;
  domain: string | null;
  tags: string[];
  category_key: string | null;
  segment_key: string | null;
};

export const getAllCompanies = async (): Promise<TServerResponse<TCompany[]>> => {
  if (process.env.READ_ONLY === 'true') {
    return { status: 200, success: true, data: [] };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  try {
    const rows = await sqlClient`
      SELECT id, name, domain, pattern, category_key, segment_key
      FROM companies
      WHERE user_id = ${auth.data.user.id}
      ORDER BY name ASC
    `;
    return {
      status: 200,
      success: true,
      data: (
        rows as {
          id: string;
          name: string;
          domain: string | null;
          pattern: string | null;
          category_key: string | null;
          segment_key: string | null;
        }[]
      ).map((r) => ({
        ...r,
        tags: r.pattern
          ? r.pattern
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      })),
    };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
