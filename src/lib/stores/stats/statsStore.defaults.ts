import { StatsState } from './statsStore.types';

const today = new Date();

export const DEFAULT_STATS_STATE: Omit<StatsState, 'actions'> = {
  month: today.getMonth() + 1,
  year: today.getFullYear(),
  isLoading: false,
  monthlyStats: null,
  trendData: null,
  categoryBreakdown: null,
  recurringBreakdown: null,
  latestTransactions: null,
};
