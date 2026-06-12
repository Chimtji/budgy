'use server';

import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { hash } from 'bcryptjs';
import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { addShareToList, putShareMetadata } from './shareUtils';
import type { TShareMetadata } from './types';

export type TSnapshot = {
  categories: Record<string, unknown>[];
  segments: Record<string, unknown>[];
  companies: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
};

const USER_ID = 'default';

export const createSnapshot = async (
  password?: string,
  durationDays?: number
): Promise<TServerResponse<{ url: string }>> => {
  try {
    const auth = await isAuthenticated();
    if (!auth.success) return { status: 401, success: false, error: 'Ikke godkendt' };

    const [categories, segments, companies, transactions, goals, subscriptions] = await Promise.all(
      [
        sqlClient`SELECT * FROM categories WHERE user_id = ${USER_ID}`,
        sqlClient`SELECT * FROM segments WHERE user_id = ${USER_ID}`,
        sqlClient`SELECT * FROM companies WHERE user_id = ${USER_ID}`,
        sqlClient`SELECT * FROM transactions WHERE user_id = ${USER_ID} AND archived = 0 ORDER BY date DESC`,
        sqlClient`SELECT * FROM goals WHERE user_id = ${USER_ID}`,
        sqlClient`SELECT * FROM subscription_matchers WHERE user_id = ${USER_ID}`,
      ]
    );

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
      console.error('SHARE_BASE_URL not set');
      return { status: 500, success: false, error: 'Delekonfiguration mangler' };
    }

    const shareId = randomUUID();

    // Upload snapshot with overwrite allowed (safe since shareId is unique)
    await put(`snapshot:${shareId}`, JSON.stringify(snapshot), { 
      access: 'public',
      allowOverwrite: true 
    });

    // Create metadata
    const metadata: TShareMetadata = {
      status: 'active',
    };
    if (password) {
      metadata.passwordHash = await hash(password, 10);
    }
    if (durationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      metadata.expiresAt = expiresAt.toISOString();
    }
    await putShareMetadata(shareId, metadata);

    // Add to share list
    await addShareToList({
      shareId,
      createdAt: new Date().toISOString(),
      expiresAt: metadata.expiresAt || null,
      passwordProtected: !!password,
      status: 'active',
    });

    const url = `${baseUrl}/view/${shareId}`;

    return { status: 200, success: true, data: { url } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukendt fejl';
    console.error('createSnapshot error:', err);
    return { status: 500, success: false, error: `Kunne ikke oprette deling: ${message}` };
  }
};
