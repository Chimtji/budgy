'use server';

import { cookies } from 'next/headers';
import { FULL_DAY, type TServerResponse } from '@/service';
import { getBankToken } from '@/service/server';

type TRequisition = {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  user_language: string;
  link: string;
  ssn: string;
  account_selection: boolean;
  redirect_immediate: boolean;
};

export const getBankRequisition = async (
  institutionId: string
): Promise<
  TServerResponse<{
    ref: string;
    redirect: string;
  }>
> => {
  const token = await getBankToken();

  if (!token.success) {
    return token;
  }

  try {
    const cookieStore = cookies();
    const cache = cookieStore.get('requisition');

    if (cache) {
      return {
        status: 200,
        data: {
          ref: JSON.parse(cache.value).reference,
          redirect: JSON.parse(cache.value).link,
        },
        success: true,
      };
    }

    const data: TRequisition = await fetch(
      'https://bankaccountdata.gocardless.com/api/v2/requisitions/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.data}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirect: process.env.NEXT_APP_REDIRECT_URL,
          institution_id: institutionId,
          reference: `req-${Date.now()}`,
        }),
      }
    )
      .then((response) => response.json())
      .catch((error) => {
        return {
          status: 500,
          error,
          success: false,
        };
      });

    cookieStore.set({
      name: 'requisition',
      value: JSON.stringify(data),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: FULL_DAY,
      path: '/',
    });

    return {
      status: 200,
      data: { ref: data.reference, redirect: data.link },
      success: true,
    };
  } catch (error) {
    return {
      status: 500,
      error,
      success: false,
    };
  }
};
