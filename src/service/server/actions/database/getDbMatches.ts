'use server';

import { TCategoryName, TSegmentName } from '@/data/types';
import type { TServerResponse, TTimestamp } from '@/service';
import { isDbAuthenticated } from '@/service/server';
import { makeSafeObject } from '@/utilities';
import { db } from '../../database';

type TMatch = {
  category: TCategoryName;
  segment: TSegmentName;
  company: string;
  description: string;
  createdAt: TTimestamp;
};

export type TMatches = {
  [id: string]: TMatch;
};

export const getDbMatches = async (): Promise<TServerResponse<TMatches>> => {
  const authenticated = await isDbAuthenticated();

  if (!authenticated.success) {
    return authenticated;
  }

  try {
    const matchesRef = db.collection('users').doc(authenticated.data.uid).collection('matches');

    const snapshot = await matchesRef.get();

    const result: TMatches = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      result[doc.id] = makeSafeObject(data) as TMatch;
    });

    return { status: 200, data: result, success: true };
  } catch (error: any) {
    if (error.code === 8) {
      return { status: 500, error: 'Could not fetch - Quota Exceeded', success: false };
    }
    return { status: 500, error, success: false };
  }
};
