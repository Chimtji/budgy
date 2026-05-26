'use server';

import type { TServerResponse } from '@/service';

export const isAuthenticated = async (): Promise<
  TServerResponse<{ user: Record<string, any>; session: Record<string, any> }>
> => {
  return { status: 200, success: true, data: { user: { id: 'default' }, session: {} } };
};
