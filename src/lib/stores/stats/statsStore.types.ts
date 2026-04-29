export interface StatsState {
  month: number;
  year: number;
  isLoading: boolean;
  monthlyStats: {
    totalIn: number;
    totalOut: number;
    byCategory: Array<{
      categoryId: string;
      categoryLabel: string;
      amount: number;
      percentage: number;
    }>;
    previousMonthOut: number;
    changePercent: number;
  } | null;
  trendData: Array<{
    month: number;
    year: number;
    amount: number;
    date: string;
  }> | null;
  categoryBreakdown: Array<{
    categoryId: string;
    percentage: number;
    amount: number;
  }> | null;
  recurringBreakdown: {
    recurring: number;
    oneTime: number;
    recurringPercent: number;
  } | null;
  latestTransactions: any[] | null;
  actions: {
    fetchStats: (userId: string) => Promise<void>;
    setMonth: (month: number) => void;
    setYear: (year: number) => void;
  };
}
