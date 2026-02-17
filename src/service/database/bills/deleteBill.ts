'use server';

import { TServerResponse } from '../../types';
import { isAuthenticated } from '../auth/isAuthenticated';
import { sqlClient } from '../auth/server';

export const deleteBill = async (id: number): Promise<TServerResponse<{ id: number }>> => {
  const auth = await isAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    await sqlClient`
      DELETE FROM bills
      WHERE id = ${id} AND user_id = ${auth.data.user.id}
    `;

    return { status: 200, data: { id }, success: true };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
};
