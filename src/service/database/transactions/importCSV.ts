'use server';

import crypto from 'crypto';
import { categorizeTransaction } from '@/service/categorization/engine';
import { ParsedTransaction } from '@/service/csv/parser';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export const importTransactionsFromCSV = async (
  transactions: ParsedTransaction[]
): Promise<TServerResponse<{ imported: number; duplicates: number; errors: number }>> => {
  console.log('[ImportCSV] Function called with', transactions.length, 'transactions');

  const auth = await isAuthenticated();
  console.log('[ImportCSV] Auth result:', auth.success, auth.success ? auth.data?.user?.id : auth.error);

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
    console.log(`[ImportCSV] Starting import of ${transactions.length} transactions`);

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
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
        const categoryText = tx.description || tx.merchantName || 'Ukendt transaktion';
        const categorization = await categorizeTransaction(userId, categoryText);

        console.log(`[ImportCSV] Tx ${i + 1}/${transactions.length}: merchant="${tx.merchantName}", category=${categorization.categoryId}, segment=${categorization.segmentId}`);

        // Insert transaction
        const result = await sqlClient`
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
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `[ImportCSV] Tx ${i + 1} failed - merchant="${tx.merchantName}", date="${tx.transactionDate}", amount=${tx.amount}:`,
          errorMsg,
          error instanceof Error ? error.stack : ''
        );
        errors++;
      }
    }

    console.log(`[ImportCSV] Import complete: imported=${imported}, duplicates=${duplicates}, errors=${errors}`);

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
