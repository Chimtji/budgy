'use server';

import { cookies } from 'next/headers';
import { TServerResponse } from '@/service';

type TBankAuth = {
  token: string;
  requisition: any;
};

export const isBankAuthenticated = async (): Promise<TServerResponse<TBankAuth>> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token');
  const requisition = cookieStore.get('requisition');

  // @TODO: Validate each object and not just check for their existence / truthiness

  const connectionEstablished = token !== undefined && requisition !== undefined;

  if (!connectionEstablished) {
    return {
      status: 401,
      error: 'Could not verify an established connection',
      success: false,
    };
  }

  return {
    data: {
      token: token.value,
      requisition: JSON.parse(requisition.value).id,
    },
    status: 200,
    success: true,
  };
};
