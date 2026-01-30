'use server';

import { cookies } from 'next/headers';
import { TServerResponse } from '../../../types';

export const hasValidConnectionRef = async (ref: string): Promise<TServerResponse<null>> => {
  const pattern = /^req-\d{13}$/;

  if (!ref) {
    return {
      status: 500,
      error: 'no requisition found',
      success: false,
    };
  }

  if (!pattern.test(ref as string)) {
    return {
      status: 500,
      error: 'requisition did not match pattern',
      success: false,
    };
  }

  const cookieStore = cookies();
  const requisition = cookieStore.get('requisition');
  if (JSON.parse(requisition?.value as string).reference !== ref) {
    return {
      status: 500,
      error: 'ref does not match',
      success: false,
    };
  }

  return {
    data: null,
    status: 200,
    success: true,
  };
};
