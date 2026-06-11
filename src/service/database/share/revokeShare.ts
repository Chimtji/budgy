'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { deleteShareData, updateShareInList } from '@/service/database/share/shareUtils';

export const revokeShare = async (shareId: string): Promise<TServerResponse<null>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return { status: 401, success: false, error: 'Ikke godkendt' };

  await updateShareInList(shareId, { status: 'revoked' });
  await deleteShareData(shareId);

  return { status: 200, success: true, data: null };
};
