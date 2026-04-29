'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { showErrorNotification } from '@/notifications/feedback';
import {
  getCategoryBreakdown,
  getLatestTransactions,
  getMonthlyStats,
  getRecurringBreakdown,
  getTrendData,
} from '@/service/database/analytics';
import { DEFAULT_STATS_STATE } from './statsStore.defaults';
import { StatsState } from './statsStore.types';

export const useStatsStore = create<StatsState>()(
  subscribeWithSelector(
    produce((set) => ({
      ...DEFAULT_STATS_STATE,

      actions: {
        fetchStats: async (userId: string) => {
          set((state: any) => {
            state.isLoading = true;
          });

          try {
            const [monthlyRes, trendRes, categoryRes, recurringRes, txRes] = await Promise.all([
              getMonthlyStats(
                (() => {
                  const s = DEFAULT_STATS_STATE;
                  return get().year;
                })(),
                (() => {
                  const s = DEFAULT_STATS_STATE;
                  return get().month;
                })()
              ),
              getTrendData(6),
              getCategoryBreakdown(
                (() => {
                  const s = DEFAULT_STATS_STATE;
                  return get().year;
                })(),
                (() => {
                  const s = DEFAULT_STATS_STATE;
                  return get().month;
                })()
              ),
              getRecurringBreakdown(
                (() => {
                  const s = DEFAULT_STATS_STATE;
                  return get().year;
                })(),
                (() => {
                  const s = DEFAULT_STATS_STATE;
                  return get().month;
                })()
              ),
              getLatestTransactions(10),
            ]);

            set((state: any) => {
              if (monthlyRes.success) {
                state.monthlyStats = monthlyRes.data;
              }
              if (trendRes.success) {
                state.trendData = trendRes.data;
              }
              if (categoryRes.success) {
                state.categoryBreakdown = categoryRes.data;
              }
              if (recurringRes.success) {
                state.recurringBreakdown = recurringRes.data;
              }
              if (txRes.success) {
                state.latestTransactions = txRes.data;
              }
              state.isLoading = false;
            });

            if (!monthlyRes.success) {
              showErrorNotification({
                title: 'Fejl',
                message: monthlyRes.error || 'Kunne ikke hente statistik',
              });
            }
          } catch (error) {
            console.error('Failed to fetch stats:', error);
            showErrorNotification({
              title: 'Fejl',
              message: 'Uventet fejl ved hentning af statistik',
            });
            set((state: any) => {
              state.isLoading = false;
            });
          }
        },

        setMonth: (month: number) => {
          set((state: any) => {
            state.month = month;
          });
        },

        setYear: (year: number) => {
          set((state: any) => {
            state.year = year;
          });
        },
      },
    }))
  )
);

// Helper to get current state inside async functions
function get() {
  return useStatsStore.getState();
}

// Export selector hooks
export const useStatsMonth = () => useStatsStore((state) => state.month);
export const useStatsYear = () => useStatsStore((state) => state.year);
export const useMonthlyStats = () => useStatsStore((state) => state.monthlyStats);
export const useTrendData = () => useStatsStore((state) => state.trendData);
export const useCategoryBreakdown = () => useStatsStore((state) => state.categoryBreakdown);
export const useRecurringBreakdown = () => useStatsStore((state) => state.recurringBreakdown);
export const useLatestTransactions = () => useStatsStore((state) => state.latestTransactions);
export const useStatsLoading = () => useStatsStore((state) => state.isLoading);
