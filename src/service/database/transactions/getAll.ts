'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { transactionsSnapshot } from '@/service/database/snapshot';

export type TTransaction = {
  id: string;
  date: string;
  amount: number;
  description: string;
  raw_description: string;
  recipient: string;
  category_key: string | null;
  segment_key: string | null;
  imported_at: string;
  is_archived: number;
  company_name: string | null;
  company_domain: string | null;
};

type TFilters = {
  year?: number;
  category_key?: string;
  showArchived?: boolean;
};

export const getAllTransactions = async (
  filters?: TFilters
): Promise<TServerResponse<TTransaction[]>> => {
  if (process.env.READ_ONLY === 'true') {
    let data = (transactionsSnapshot as unknown[]).map((t) => ({
      recipient: '',
      company_name: null,
      company_domain: null,
      ...(t as object),
    })) as TTransaction[];
    if (filters?.year) {
      const y = String(filters.year);
      data = data.filter((t) => t.date.startsWith(y));
    }
    if (filters?.category_key) {
      data = data.filter((t) => t.category_key === filters.category_key);
    }
    return { status: 200, success: true, data };
  }

  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const uid = auth.data.user.id;

  try {
    const hasArchivedFilter = filters?.showArchived !== undefined;
    const archivedVal = filters?.showArchived ? 1 : 0;
    let rows;

    if (filters?.year && filters?.category_key) {
      rows = hasArchivedFilter
        ? await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND strftime('%Y', t.date) = ${String(filters.year)}
              AND t.category_key = ${filters.category_key}
              AND t.archived = ${archivedVal}
            ORDER BY t.date DESC
          `
        : await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND strftime('%Y', t.date) = ${String(filters.year)}
              AND t.category_key = ${filters.category_key}
            ORDER BY t.date DESC
          `;
    } else if (filters?.year) {
      rows = hasArchivedFilter
        ? await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND strftime('%Y', t.date) = ${String(filters.year)}
              AND t.archived = ${archivedVal}
            ORDER BY t.date DESC
          `
        : await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND strftime('%Y', t.date) = ${String(filters.year)}
            ORDER BY t.date DESC
          `;
    } else if (filters?.category_key) {
      rows = hasArchivedFilter
        ? await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND t.category_key = ${filters.category_key}
              AND t.archived = ${archivedVal}
            ORDER BY t.date DESC
          `
        : await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND t.category_key = ${filters.category_key}
            ORDER BY t.date DESC
          `;
    } else {
      rows = hasArchivedFilter
        ? await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
              AND t.archived = ${archivedVal}
            ORDER BY t.date DESC
          `
        : await sqlClient`
            SELECT t.id, t.date, t.amount, t.description, t.raw_description, t.recipient,
                   t.category_key, t.segment_key, t.imported_at, t.archived AS is_archived,
                   c.name AS company_name, c.domain AS company_domain
            FROM transactions t
            LEFT JOIN companies c ON c.id = t.company_id
            WHERE t.user_id = ${uid}
            ORDER BY t.date DESC
          `;
    }

    return { status: 200, success: true, data: rows as TTransaction[] };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
