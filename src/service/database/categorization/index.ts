'use server';

import crypto from 'crypto';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export interface CategorizationRule {
  id: string;
  pattern: string;
  categoryId: string;
  segmentId: string;
  priority: number;
  isDefault: boolean;
}

export const createRule = async (
  pattern: string,
  categoryId: string,
  segmentId: string,
  priority: number = 0
): Promise<TServerResponse<CategorizationRule>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const id = crypto.randomUUID();
    await sqlClient`
      INSERT INTO categorization_rules (
        id, user_id, pattern, category_id, segment_id, priority, is_default
      )
      VALUES (
        ${id}, ${userId}, ${pattern}, ${categoryId}, ${segmentId}, ${priority}, false
      )
      ON CONFLICT (user_id, pattern)
      DO UPDATE SET
        category_id = ${categoryId},
        segment_id = ${segmentId},
        priority = ${priority},
        updated_at = NOW()
    `;

    return {
      status: 200,
      success: true,
      data: {
        id,
        pattern,
        categoryId,
        segmentId,
        priority,
        isDefault: false,
      },
    };
  } catch (error) {
    console.error('Failed to create categorization rule:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke gemme regel',
    };
  }
};
