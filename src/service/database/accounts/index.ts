'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export interface ConnectionStatus {
  isConnected: boolean;
  accountName: string | null;
  lastImportAt: string | null;
  importCount: number;
}

export const getConnectionStatus = async (): Promise<
  TServerResponse<ConnectionStatus>
> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    // Count total imported transactions
    const result = await sqlClient`
      SELECT COUNT(*) as count, MAX(created_at) as last_import
      FROM transactions
      WHERE user_id = ${userId}
    `;

    const count = result[0]?.count || 0;
    const lastImport = result[0]?.last_import;

    return {
      status: 200,
      success: true,
      data: {
        isConnected: count > 0,
        accountName: 'CSV Bank Imports',
        lastImportAt: lastImport ? new Date(lastImport).toISOString() : null,
        importCount: count,
      },
    };
  } catch (error) {
    console.error('Failed to get connection status:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente status',
    };
  }
};

export const getImportHistory = async (): Promise<
  TServerResponse<
    Array<{
      importedAt: string;
      transactionCount: number;
    }>
  >
> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const result = await sqlClient`
      SELECT DATE(created_at) as import_date, COUNT(*) as count
      FROM transactions
      WHERE user_id = ${userId}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 30
    `;

    const history = result.map((row: any) => ({
      importedAt: new Date(row.import_date).toISOString(),
      transactionCount: row.count,
    }));

    return {
      status: 200,
      success: true,
      data: history,
    };
  } catch (error) {
    console.error('Failed to get import history:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente importhistorik',
    };
  }
};
