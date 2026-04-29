'use server';

import crypto from 'crypto';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export interface SubscriptionData {
  id: string;
  merchantName: string;
  categoryId: string;
  segmentId: string;
  expectedAmount: number;
  currency: string;
  cadence: string;
  nextDueDate: string | null;
  detectionConfidence: number;
  isActive: boolean;
  notes: string | null;
}

export const getSubscriptions = async (): Promise<TServerResponse<SubscriptionData[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const result = await sqlClient`
      SELECT
        id, merchant_name, category_id, segment_id, expected_amount, currency,
        cadence, next_due_date, detection_confidence, is_active, notes
      FROM subscriptions
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY merchant_name ASC
    `;

    const subs: SubscriptionData[] = result.map((row) => ({
      id: row.id,
      merchantName: row.merchant_name,
      categoryId: row.category_id,
      segmentId: row.segment_id,
      expectedAmount: Number(row.expected_amount),
      currency: row.currency,
      cadence: row.cadence,
      nextDueDate: row.next_due_date,
      detectionConfidence: row.detection_confidence,
      isActive: row.is_active,
      notes: row.notes,
    }));

    return {
      status: 200,
      success: true,
      data: subs,
    };
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente abonnementer',
    };
  }
};

export const createSubscription = async (
  merchantName: string,
  categoryId: string,
  segmentId: string,
  expectedAmount: number,
  cadence: string,
  nextDueDate?: string
): Promise<TServerResponse<SubscriptionData>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const id = crypto.randomUUID();
    await sqlClient`
      INSERT INTO subscriptions (
        id, user_id, merchant_name, category_id, segment_id,
        expected_amount, cadence, next_due_date, detection_confidence, is_active
      )
      VALUES (
        ${id}, ${userId}, ${merchantName}, ${categoryId}, ${segmentId},
        ${expectedAmount}, ${cadence}, ${nextDueDate || null}, 100, true
      )
    `;

    return {
      status: 200,
      success: true,
      data: {
        id,
        merchantName,
        categoryId,
        segmentId,
        expectedAmount,
        currency: 'EUR',
        cadence,
        nextDueDate: nextDueDate || null,
        detectionConfidence: 100,
        isActive: true,
        notes: null,
      },
    };
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke oprette abonnement',
    };
  }
};

export const updateSubscription = async (
  subscriptionId: string,
  categoryId: string,
  segmentId: string,
  expectedAmount?: number,
  cadence?: string
): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    await sqlClient`
      UPDATE subscriptions
      SET
        category_id = ${categoryId},
        segment_id = ${segmentId},
        expected_amount = COALESCE(${expectedAmount || null}, expected_amount),
        cadence = COALESCE(${cadence || null}, cadence),
        updated_at = NOW()
      WHERE id = ${subscriptionId} AND user_id = ${userId}
    `;

    return {
      status: 200,
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke opdatere abonnement',
    };
  }
};

export const deleteSubscription = async (
  subscriptionId: string
): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    await sqlClient`
      UPDATE subscriptions
      SET is_active = false, updated_at = NOW()
      WHERE id = ${subscriptionId} AND user_id = ${userId}
    `;

    return {
      status: 200,
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Failed to delete subscription:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke slette abonnement',
    };
  }
};
