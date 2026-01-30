'use server';

import { cookies } from 'next/headers';
import { FULL_DAY, type TServerResponse } from '@/service';
import { isFullAuthenticated } from '@/service/server';
import { makeSafeObject } from '@/utilities';

export const getBankAccounts = async (): Promise<TServerResponse<string[]>> => {
  const auth = await isFullAuthenticated();

  if (!auth.success) {
    return auth;
  }

  try {
    const cookieStore = cookies();
    const cache = cookieStore.get('accounts');

    if (cache) {
      const parsedCache: string[] = JSON.parse(cache.value);

      if (parsedCache.length > 0) {
        return { status: 200, data: parsedCache, success: true };
      }
    }

    console.log(auth.data.requisition);

    const data = await fetch(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${auth.data.requisition}/`,
      { headers: { Authorization: `Bearer ${auth.data.token}` } }
    )
      .then((response) => response.json())
      .catch((error) => {
        return { status: 500, error, success: false };
      });

    console.log('ACCOUNT FETCH:', data);

    if (data.accounts.length === 0) {
      return { status: 500, error: 'No Accounts Found', success: false };
    }

    cookieStore.set({
      name: 'accounts',
      value: JSON.stringify(data.accounts),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: FULL_DAY,
      path: '/',
    });

    return { status: 200, data: makeSafeObject(data.accounts), success: true };
  } catch (error) {
    return { status: 500, error, success: false };
  }
};
