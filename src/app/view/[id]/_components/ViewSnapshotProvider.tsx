'use client';

import { createContext, useContext } from 'react';
import type { TCategory } from '@/service/database/categories/getAll';
import type { TGoal } from '@/service/database/goals/getAll';
import type { TSegment } from '@/service/database/segments/getAll';
import type { TSnapshot } from '@/service/database/share/createSnapshot';
import type { TSubscriptionMatcher } from '@/service/database/subscriptions/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TTypedSnapshot = {
  categories: TCategory[];
  segments: TSegment[];
  transactions: TTransaction[];
  goals: TGoal[];
  subscriptions: TSubscriptionMatcher[];
};

const ViewSnapshotContext = createContext<TTypedSnapshot | null>(null);

type TProps = {
  snapshot: TSnapshot;
  children: React.ReactNode;
};

export const ViewSnapshotProvider = ({ snapshot, children }: TProps) => {
  const typedSnapshot: TTypedSnapshot = {
    categories: snapshot.categories as TCategory[],
    segments: snapshot.segments as TSegment[],
    transactions: snapshot.transactions as TTransaction[],
    goals: snapshot.goals as TGoal[],
    subscriptions: snapshot.subscriptions as TSubscriptionMatcher[],
  };

  return (
    <ViewSnapshotContext.Provider value={typedSnapshot}>{children}</ViewSnapshotContext.Provider>
  );
};

export const useViewSnapshot = () => {
  const ctx = useContext(ViewSnapshotContext);
  if (!ctx) throw new Error('useViewSnapshot must be used inside ViewSnapshotProvider');
  return ctx;
};
