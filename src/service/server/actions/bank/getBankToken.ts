'use server';

import { cookies } from 'next/headers';
import { FULL_DAY, TServerResponse } from '@/service';

type TAPIToken = {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
};

export const getBankToken = async (): Promise<TServerResponse<TAPIToken['access']>> => {
  const cookieStore = await cookies();
  const cache = cookieStore.get('access_token');

  if (cache) {
    return {
      status: 200,
      data: cache.value,
      success: true,
    };
  }

  const data: TAPIToken = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: process.env.NEXT_APP_SECRET_ID,
      secret_key: process.env.NEXT_APP_SECRET_KEY,
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      return {
        status: 500,
        error,
        success: false,
      };
    });

  cookieStore.set({
    name: 'access_token',
    value: data.access,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: FULL_DAY,
    path: '/',
  });

  return {
    status: 200,
    data: data.access,
    success: true,
  };
};
