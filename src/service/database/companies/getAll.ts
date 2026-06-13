'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { getActiveShareSnapshot } from '@/service/database/share/shareContext';

export type TCompany = {
  id: string;
  name: string;
  domain: string | null;
  tags: string[];
  category_key: string | null;
  segment_key: string | null;
};

export const getAllCompanies = async (): Promise<TServerResponse<TCompany[]>> => {
  const shareSnapshot = await getActiveShareSnapshot();
  if (shareSnapshot) {
    return {
      status: 200,
      success: true,
      data: (shareSnapshot.companies as Record<string, unknown>[]).map((company) => {
        const pattern = String(company.pattern ?? '');
        return {
          ...(company as TCompany),
          tags: pattern
            ? pattern
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        };
      }),
    };
  }

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
