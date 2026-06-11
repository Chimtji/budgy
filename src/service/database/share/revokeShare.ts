'use server';

import type { TServerResponse } from '@/service';
import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { deleteShareData, getShareMetadata, putShareMetadata, updateShareInList } from '@/service/database/share/shareUtils';

export const revokeShare = async (shareId: string): Promise<TServerResponse<null>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return { status: 401, success: false, error: 'Ikke godkendt' };

  // Mark as revoked in metadata (for public access check)
  const metadata = await getShareMetadata(shareId);
  if (metadata) {
    await putShareMetadata(shareId, { ...metadata, status: 'revoked' });
  }
  
  // Mark as revoked in share list (for user's history)
  await updateShareInList(shareId, { status: 'revoked' });
  
  // Delete the actual snapshot data
  await deleteShareData(shareId);

  return { status: 200, success: true, data: null };
};
