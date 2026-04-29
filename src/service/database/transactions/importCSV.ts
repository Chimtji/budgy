'use server';

import crypto from 'crypto';
import { categorizeTransaction } from '@/service/categorization/engine';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { ParsedTransaction } from '@/service/csv/parser';
import { TServerResponse } from '@/service/types';

export const importTransactionsFromCSV = async (
  transactions: ParsedTransaction[]
): Promise<TServerResponse<{ imported: number; duplicates: number; errors: number }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  if (!transactions || transactions.length === 0) {
    return {
      status: 400,
      success: false,
      error: 'Ingen transaktioner i CSV-filen',
    };
  }

  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  try {
    for (const tx of transactions) {
      try {
        // Create a unique identifier for the transaction
        const externalId = crypto
          .createHash('sha256')
          .update(`${tx.transactionDate}-${tx.merchantName}-${tx.amount}`)
          .digest('hex');

        // Check if transaction already exists
        const existing = await sqlClient`
          SELECT id FROM transactions
          WHERE user_id = ${userId} AND external_id = ${externalId}
        `;

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Categorize transaction
        const categoryText =
          tx.description || tx.merchantName || 'Ukendt transaktion';
        const categorization = await categorizeTransaction(userId, categoryText);

        // Insert transaction
        await sqlClient`
          INSERT INTO transactions (
            id, user_id, external_id, merchant_name, description,
            amount, currency, transaction_date, transaction_type,
            category_id, segment_id, is_manual_override, created_at
          )
          VALUES (
            ${crypto.randomUUID()},
            ${userId},
            ${externalId},
            ${tx.merchantName},
            ${tx.description || null},
            ${tx.amount},
            ${tx.currency},
            ${tx.transactionDate},
            ${tx.type === 'debit' ? 'DEBIT' : 'CREDIT'},
            ${categorization.categoryId || null},
            ${categorization.segmentId || null},
            false,
            NOW()
          )
        `;

        imported++;
      } catch (error) {
        console.error('Failed to import transaction:', error instanceof Error ? error.message : String(error));
        errors++;
      }
    }

    return {
      status: 200,
      success: true,
      data: { imported, duplicates, errors },
    };
  } catch (error) {
    console.error('Failed to import transactions:', error);
    return {
      status: 500,
      success: false,
      error: 'Import mislykkedes',
    };
  }
};
