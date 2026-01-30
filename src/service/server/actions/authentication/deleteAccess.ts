'use server';

import { cookies } from 'next/headers';
import type { TServerResponse } from '@/service';

export const deleteAccess = async (): Promise<TServerResponse<null>> => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('requisition');
    cookieStore.delete('access_token');
    cookieStore.delete('user');
    cookieStore.delete('accounts');
    cookieStore.delete('__budgy_session');

    return { success: true, status: 200, data: null };
  } catch (error) {
    return { success: false, status: 500, error };
  }
};
