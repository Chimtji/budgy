import { type TServerResponse } from '@/service';
import { isBankAuthenticated, isDbAuthenticated } from '@/service/server';

type TAuth = {
  token: string;
  requisition: any;
  uid: string;
};

export const isFullAuthenticated = async (): Promise<TServerResponse<TAuth>> => {
  const dbAuth = await isDbAuthenticated();

  if (!dbAuth.success) {
    return dbAuth;
  }

  const bankAuth = await isBankAuthenticated();
  if (!bankAuth.success) {
    return bankAuth;
  }

  return {
    success: true,
    status: 200,
    data: {
      uid: dbAuth.data.uid,
      token: bankAuth.data.token,
      requisition: bankAuth.data.requisition,
    },
  };
};
