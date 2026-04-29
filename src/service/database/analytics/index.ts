'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export interface MonthlyStats {
  totalIn: number;
  totalOut: number;
  byCategory: {
    categoryId: string;
    categoryLabel: string;
    amount: number;
    percentage: number;
  }[];
  previousMonthOut: number;
  changePercent: number;
}

export interface TrendPoint {
  month: number;
  year: number;
  amount: number;
  date: string;
}

export interface RecurringBreakdown {
  recurring: number;
  oneTime: number;
  recurringPercent: number;
}

export const getMonthlyStats = async (
  year: number,
  month: number
): Promise<TServerResponse<MonthlyStats>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    // Get current month totals by category
    const currentMonth = await sqlClient`
      SELECT
        t.category_id,
        SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expense
      FROM transactions t
      WHERE t.user_id = ${userId}
      AND EXTRACT(YEAR FROM t.transaction_date) = ${year}
      AND EXTRACT(MONTH FROM t.transaction_date) = ${month}
      GROUP BY t.category_id
    `;

    const totalIn = currentMonth.reduce((sum, row) => sum + Number(row.income || 0), 0);
    const totalOut = currentMonth.reduce((sum, row) => sum + Number(row.expense || 0), 0);

    // Get previous month totals for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const previousMonthData = await sqlClient`
      SELECT SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expense
      FROM transactions
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM transaction_date) = ${prevYear}
      AND EXTRACT(MONTH FROM transaction_date) = ${prevMonth}
    `;

    const previousMonthOut = previousMonthData[0] ? Number(previousMonthData[0].expense || 0) : 0;
    const changePercent =
      previousMonthOut > 0 ? ((totalOut - previousMonthOut) / previousMonthOut) * 100 : 0;

    // Get category breakdown (need to fetch category labels)
    const categoryBreakdown = currentMonth.map((row) => ({
      categoryId: row.category_id || 'uncategorized',
      categoryLabel: row.category_id ? row.category_id : 'Uncategorized',
      amount: Number(row.expense || 0),
      percentage: totalOut > 0 ? (Number(row.expense || 0) / totalOut) * 100 : 0,
    }));

    return {
      status: 200,
      success: true,
      data: {
        totalIn,
        totalOut,
        byCategory: categoryBreakdown,
        previousMonthOut,
        changePercent,
      },
    };
  } catch (error) {
    console.error('Failed to get monthly stats:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente månedlig statistik',
    };
  }
};

export const getTrendData = async (months: number = 6): Promise<TServerResponse<TrendPoint[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - (months - 1));

    const result = await sqlClient`
      SELECT
        EXTRACT(YEAR FROM transaction_date)::int as year,
        EXTRACT(MONTH FROM transaction_date)::int as month,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as amount
      FROM transactions
      WHERE user_id = ${userId}
      AND transaction_date >= ${startDate.toISOString().split('T')[0]}
      GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date)
      ORDER BY year ASC, month ASC
    `;

    const trends: TrendPoint[] = result.map((row) => ({
      month: row.month,
      year: row.year,
      amount: Number(row.amount || 0),
      date: `${row.month}/${row.year}`,
    }));

    return {
      status: 200,
      success: true,
      data: trends,
    };
  } catch (error) {
    console.error('Failed to get trend data:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente trenddata',
    };
  }
};

export const getCategoryBreakdown = async (
  year: number,
  month: number
): Promise<TServerResponse<Array<{ categoryId: string; percentage: number; amount: number }>>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const result = await sqlClient`
      SELECT
        t.category_id,
        SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as amount
      FROM transactions t
      WHERE t.user_id = ${userId}
      AND EXTRACT(YEAR FROM t.transaction_date) = ${year}
      AND EXTRACT(MONTH FROM t.transaction_date) = ${month}
      GROUP BY t.category_id
      ORDER BY amount DESC
    `;

    const total = result.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const breakdown = result.map((row) => ({
      categoryId: row.category_id || 'uncategorized',
      amount: Number(row.amount || 0),
      percentage: total > 0 ? (Number(row.amount || 0) / total) * 100 : 0,
    }));

    return {
      status: 200,
      success: true,
      data: breakdown,
    };
  } catch (error) {
    console.error('Failed to get category breakdown:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente kategori opdeling',
    };
  }
};

export const getRecurringBreakdown = async (
  year: number,
  month: number
): Promise<TServerResponse<RecurringBreakdown>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    // Get subscriptions' monthly cost
    const subscriptions = await sqlClient`
      SELECT
        SUM(s.expected_amount) as recurring_amount
      FROM subscriptions s
      WHERE s.user_id = ${userId} AND s.is_active = true
    `;

    const recurring = subscriptions[0] ? Number(subscriptions[0].recurring_amount || 0) : 0;

    // Get total expenses for the month
    const monthly = await sqlClient`
      SELECT
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense
      FROM transactions
      WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM transaction_date) = ${year}
      AND EXTRACT(MONTH FROM transaction_date) = ${month}
    `;

    const total = monthly[0] ? Number(monthly[0].total_expense || 0) : 0;
    const oneTime = Math.max(0, total - recurring);
    const recurringPercent = total > 0 ? (recurring / total) * 100 : 0;

    return {
      status: 200,
      success: true,
      data: {
        recurring,
        oneTime,
        recurringPercent,
      },
    };
  } catch (error) {
    console.error('Failed to get recurring breakdown:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke beregne fast udgifter',
    };
  }
};

export const getLatestTransactions = async (
  limit: number = 10
): Promise<TServerResponse<any[]>> => {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    const result = await sqlClient`
      SELECT
        id,
        merchant_name,
        amount,
        transaction_date,
        category_id
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY transaction_date DESC
      LIMIT ${limit}
    `;

    return {
      status: 200,
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Failed to get latest transactions:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke hente seneste transaktioner',
    };
  }
};
