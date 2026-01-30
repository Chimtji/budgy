'use server';

import { type TServerResponse } from '@/service';
import { isDbAuthenticated } from '@/service/server';
import { cleanDescription } from '@/stores/transactions/helpers';
import { db } from '../../database';

type TMatch = {
  description: string;
  category: string;
  segment: string;
  company: string;
  createdAt: Date;
};

export const addDbMatch = async ({
  description,
  category,
  segment,
  company,
}: Omit<TMatch, 'createdAt'>): Promise<TServerResponse<TMatch>> => {
  const authenticated = await isDbAuthenticated();

  if (!authenticated.success) {
    return authenticated;
  }

  try {
    const userId = authenticated.data.uid;
    const matchesRef = db.collection('users').doc(userId).collection('matches');

    const snapshot = await matchesRef.get();
    const alreadyMatched = snapshot.docs.find(
      (doc) => doc.data().description === cleanDescription(description)
    );

    const match = {
      description: cleanDescription(description),
      category,
      segment,
      company,
      createdAt: new Date(),
    };

    if (!alreadyMatched) {
      await matchesRef.add(match);
    }

    return { status: 200, success: true, data: match };
  } catch (error) {
    return { status: 500, success: false, error };
  }
};
