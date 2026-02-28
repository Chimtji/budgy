'use server';

import type { TServerResponse } from '@/service';
import { auth } from './server';

export const isAuthenticated = async (): Promise<
  TServerResponse<{ user: Record<string, any>; session: Record<string, any> }>
> => {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return {
      status: 401,
      error: 'Could not verify authentication',
      success: false,
    };
  }

  return {
    data: session,
    status: 200,
    success: true,
  };
};
