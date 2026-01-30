'use server';

import type { TServerResponse } from '@/service';
import { getBankToken } from '@/service/server';

type TAPIBank = {
  id: string;
  name: string;
  bic?: string;
  transactional_total_days?: string;
  max_access_valid_for_days?: string;
  countries: string[];
  logo: string;
};

export const getBanks = async (): Promise<TServerResponse<TAPIBank[]>> => {
  // This is an open endpoint, so we don't need bank auth to do this, just the token.
  // This is used when starting the bank authentication process (which bank to get auth to)
  const auth = await getBankToken();

  if (!auth.success) {
    return auth;
  }

  const data = await fetch(
    `https://bankaccountdata.gocardless.com/api/v2/institutions/?country=dk`,
    {
      headers: { Authorization: `Bearer ${auth.data}` },
    }
  )
    .then((response) => response.json())
    .catch((error) => {
      return {
        status: 500,
        data: [],
        error,
        success: false,
      };
    });

  if (data.status_code !== 200) {
    return {
      status: data.status_code,
      error: data.summary,
      success: false,
    };
  }

  return {
    status: 200,
    data,
    success: true,
  };
};
