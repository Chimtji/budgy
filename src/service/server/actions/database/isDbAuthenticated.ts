'use server';

import { DecodedIdToken } from 'firebase-admin/auth';
import type { TServerResponse } from '@/service';
import { getUserSession } from '@/service/server';

export const isDbAuthenticated = async (): Promise<TServerResponse<DecodedIdToken>> => {
  const userSession = await getUserSession();

  if (!userSession) {
    return {
      status: 401,
      error: 'Could not verify authentication',
      success: false,
    };
  }

  return {
    data: userSession,
    status: 200,
    success: true,
  };
};
