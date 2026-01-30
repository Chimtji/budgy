'use server';

import type { TServerResponse, TTimestamp } from '@/service';
import { isDbAuthenticated } from '@/service/server';
import { makeSafeObject } from '@/utilities';
import { db } from '../../database';

type TCompanies = { [id: string]: { label: string; createdAt: TTimestamp } };

export const getDbCompanies = async (): Promise<TServerResponse<TCompanies>> => {
  const authenticated = await isDbAuthenticated();

  if (!authenticated.success) {
    return authenticated;
  }

  try {
    const companiesRef = db.collection('companies');
    const snapshot = await companiesRef.get();

    const result: TCompanies = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      result[doc.id] = makeSafeObject(data);
    });

    return { status: 200, data: result, success: true };
  } catch (error) {
    return { status: 500, error, success: false };
  }
};
