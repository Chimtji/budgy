'use client';

import { SubscriptionsState } from './subscriptionsStore.types';

export const DEFAULT_SUBSCRIPTIONS_STATE: SubscriptionsState = {
  subscriptions: [],
  detectedSubscriptions: [],
  isLoading: false,
  isDetecting: false,
  filters: {},
};
