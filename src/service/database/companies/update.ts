'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import type { TCompany } from './getAll';

export const updateCompany = async (input: {
  id: string;
  name: string;
  domain?: string | null;
  tags?: string[];
  category_key?: string | null;
  segment_key?: string | null;
}): Promise<TServerResponse<TCompany>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const domain = input.domain?.trim() || null;
  const pattern =
    input.tags && input.tags.length > 0
      ? input.tags
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .join(',')
      : input.name.trim().toLowerCase();
  const category_key = input.category_key ?? null;
  const segment_key = input.segment_key ?? null;

  try {
    const rows = await sqlClient`
      UPDATE companies
      SET name = ${input.name.trim()}, domain = ${domain}, pattern = ${pattern},
          category_key = ${category_key}, segment_key = ${segment_key}
      WHERE id = ${input.id} AND user_id = ${auth.data.user.id}
      RETURNING id, name, domain, pattern, category_key, segment_key
    `;
    const r = rows[0] as {
      id: string;
      name: string;
      domain: string | null;
      pattern: string | null;
      category_key: string | null;
      segment_key: string | null;
    };
    return {
      status: 200,
      success: true,
      data: {
        ...r,
        tags: r.pattern
          ? r.pattern
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      },
    };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
