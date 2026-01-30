'use server';

import { type TServerResponse } from '@/service';
import { isDbAuthenticated } from '@/service/server';
import { db } from '../../database';

export const addDbCompany = async (company: string): Promise<TServerResponse<{ id: string }>> => {
  const authenticated = await isDbAuthenticated();

  if (!authenticated.success) {
    return authenticated;
  }

  try {
    const companiesRef = db.collection('companies');
    const docRef = await companiesRef.add({ label: company, createdAt: new Date() });

    return { status: 200, success: true, data: { id: docRef.id } };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
