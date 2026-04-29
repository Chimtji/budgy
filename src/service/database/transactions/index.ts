'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export interface TransactionData {
  id: string;
  externalId: string;
  merchantName: string;
  description: string | null;
  amount: number;
  currency: string;
  transactionDate: string;
  bookingDate: string | null;
  transactionType: string;
  categoryId: string | null;
  segmentId: string | null;
  isManualOverride: boolean;
  notes: string | null;
  createdAt: string;
}

export const getTransactionsByMonth = async (
  year: number,
  month: number,
  page: number = 1,
  limit: number = 100
): Promise<TServerResponse<TransactionData[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const result = await sqlClient`
      SELECT
        id, external_id, merchant_name, description, amount, currency,
        transaction_date, booking_date, transaction_type, category_id,
        segment_id, is_manual_override, notes, created_at
      FROM transactions
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM transaction_date) = ${year}
      AND EXTRACT(MONTH FROM transaction_date) = ${month}
      ORDER BY transaction_date DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;

    const transactions: TransactionData[] = result.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      merchantName: row.merchant_name,
      description: row.description,
      amount: Number(row.amount),
      currency: row.currency,
      transactionDate: row.transaction_date,
      bookingDate: row.booking_date,
      transactionType: row.transaction_type,
      categoryId: row.category_id,
      segmentId: row.segment_id,
      isManualOverride: row.is_manual_override,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    return {
      status: 200,
      success: true,
      data: transactions,
    };
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente transaktioner',
    };
  }
};

export const getTransaction = async (
  transactionId: string
): Promise<TServerResponse<TransactionData>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const result = await sqlClient`
      SELECT
        id, external_id, merchant_name, description, amount, currency,
        transaction_date, booking_date, transaction_type, category_id,
        segment_id, is_manual_override, notes, created_at
      FROM transactions
      WHERE id = ${transactionId} AND user_id = ${userId}
    `;

    if (result.length === 0) {
      return {
        status: 400,
        success: false,
        error: 'Transaktion ikke fundet',
      };
    }

    const row = result[0];
    const transaction: TransactionData = {
      id: row.id,
      externalId: row.external_id,
      merchantName: row.merchant_name,
      description: row.description,
      amount: Number(row.amount),
      currency: row.currency,
      transactionDate: row.transaction_date,
      bookingDate: row.booking_date,
      transactionType: row.transaction_type,
      categoryId: row.category_id,
      segmentId: row.segment_id,
      isManualOverride: row.is_manual_override,
      notes: row.notes,
      createdAt: row.created_at,
    };

    return {
      status: 200,
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente transaktion',
    };
  }
};

export const updateTransactionCategory = async (
  transactionId: string,
  categoryId: string | null,
  segmentId: string | null
): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    await sqlClient`
      UPDATE transactions
      SET
        category_id = ${categoryId},
        segment_id = ${segmentId},
        is_manual_override = true,
        updated_at = NOW()
      WHERE id = ${transactionId} AND user_id = ${userId}
    `;

    return {
      status: 200,
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke opdatere transaktion',
    };
  }
};

export const deleteTransaction = async (transactionId: string): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    await sqlClient`
      DELETE FROM transactions
      WHERE id = ${transactionId} AND user_id = ${userId}
    `;

    return {
      status: 200,
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke slette transaktion',
    };
  }
};

export const bulkUpdateTransactionsCategory = async (
  transactionIds: string[],
  categoryId: string,
  segmentId: string
): Promise<TServerResponse<void>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  if (!transactionIds.length) {
    return {
      status: 400,
      success: false,
      error: 'Ingen transaktioner valgt',
    };
  }

  const userId = auth.data.user.id;

  try {
    await sqlClient`
      UPDATE transactions
      SET
        category_id = ${categoryId},
        segment_id = ${segmentId},
        is_manual_override = true,
        updated_at = NOW()
      WHERE id = ANY(${transactionIds}) AND user_id = ${userId}
    `;

    return {
      status: 200,
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Failed to bulk update transactions:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke opdatere transaktioner',
    };
  }
};
