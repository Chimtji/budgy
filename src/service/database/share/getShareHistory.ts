'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { getShareList } from '@/service/database/share/shareUtils';

export const getShareHistory = async (): Promise<TServerResponse<{ shares: any[] }>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return { status: 401, success: false, error: 'Ikke godkendt' };

  const shares = await getShareList();
  return { status: 200, success: true, data: { shares } };
};
