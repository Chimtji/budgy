'use client';

import { SubscriptionData } from '@/service/database/subscriptions';
import { DetectedSubscription } from '@/service/database/subscriptions/detect';

export interface SubscriptionsState {
  subscriptions: SubscriptionData[];
  detectedSubscriptions: DetectedSubscription[];
  isLoading: boolean;
  isDetecting: boolean;
  filters: {
    cadence?: string;
    category?: string;
    isActive?: boolean;
  };
}

export interface SubscriptionsActions {
  fetch: () => Promise<void>;
  create: (
    merchantName: string,
    categoryId: string,
    segmentId: string,
    expectedAmount: number,
    cadence: string,
    nextDueDate?: string
  ) => Promise<void>;
  update: (
    id: string,
    categoryId: string,
    segmentId: string,
    expectedAmount?: number,
    cadence?: string,
    notes?: string
  ) => Promise<void>;
  delete: (id: string) => Promise<void>;
  detectNew: () => Promise<void>;
  confirmDetected: (merchantName: string, categoryId: string, segmentId: string) => Promise<void>;
  ignoreDetected: (merchantName: string) => void;
  setFilter: (filter: Partial<SubscriptionsState['filters']>) => void;
  clearFilter: () => void;
}

export type SubscriptionsStore = SubscriptionsState & {
  actions: SubscriptionsActions;
};
