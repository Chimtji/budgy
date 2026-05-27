'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';

export type TSnapshot = {
  categories: Record<string, unknown>[];
  segments: Record<string, unknown>[];
  companies: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
};

const USER_ID = 'default';

export const createSnapshot = async (): Promise<TServerResponse<{ url: string }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return { status: 401, success: false, error: 'Ikke godkendt' };

  const [categories, segments, companies, transactions, goals, subscriptions] = await Promise.all([
    sqlClient`SELECT * FROM categories WHERE user_id = ${USER_ID}`,
    sqlClient`SELECT * FROM segments WHERE user_id = ${USER_ID}`,
    sqlClient`SELECT * FROM companies WHERE user_id = ${USER_ID}`,
    sqlClient`SELECT * FROM transactions WHERE user_id = ${USER_ID} AND is_archived = 0 ORDER BY date DESC`,
    sqlClient`SELECT * FROM goals WHERE user_id = ${USER_ID}`,
    sqlClient`SELECT * FROM subscription_matchers WHERE user_id = ${USER_ID}`,
  ]);

  const snapshot: TSnapshot = {
    categories,
    segments,
    companies,
    transactions,
    goals,
    subscriptions,
  };

  const baseUrl = process.env.SHARE_BASE_URL;
  if (!baseUrl) {
    return { status: 500, success: false, error: 'SHARE_BASE_URL er ikke konfigureret' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.SHARE_API_SECRET;
  if (secret) headers['Authorization'] = `Bearer ${secret}`;

  const response = await fetch(`${baseUrl}/api/share`, {
    method: 'POST',
    headers,
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    return { status: 500, success: false, error: 'Kunne ikke uploade snapshot' };
  }

  const { id } = await response.json();
  const url = `${baseUrl}/view/${id}`;

  return { status: 200, success: true, data: { url } };
};
