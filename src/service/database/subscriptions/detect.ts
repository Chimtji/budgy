'use server';

import { isAuthenticated } from '@/service/database/auth/isAuthenticated';
import { sqlClient } from '@/service/database/auth/server';
import { TServerResponse } from '@/service/types';

export interface DetectedSubscription {
  merchantName: string;
  expectedAmount: number;
  cadence: string;
  confidence: number;
  nextDueDate: string | null;
  lastTransactionDate: string;
  transactionCount: number;
}

interface TransactionGroup {
  merchantName: string;
  transactions: Array<{
    date: string;
    amount: number;
  }>;
}

/**
 * Calculate standard deviation for amount consistency check
 */
function calculateVariance(amounts: number[]): number {
  if (amounts.length < 2) return 0;
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  return Math.sqrt(variance) / mean; // Coefficient of variation
}

/**
 * Calculate intervals between transaction dates in days
 */
function calculateIntervals(dates: string[]): number[] {
  const sortedDates = [...dates].sort();
  const intervals: number[] = [];

  for (let i = 1; i < sortedDates.length; i++) {
    const curr = new Date(sortedDates[i]).getTime();
    const prev = new Date(sortedDates[i - 1]).getTime();
    const daysDiff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    intervals.push(daysDiff);
  }

  return intervals;
}

/**
 * Detect cadence from transaction intervals
 */
function detectCadence(intervals: number[]): { cadence: string; regularity: number } {
  if (intervals.length === 0) return { cadence: 'IRREGULAR', regularity: 0 };

  // Calculate mean interval and standard deviation
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (lower is more regular)
  const regularity = 1 - Math.min(stdDev / mean, 1);

  // Detect cadence based on mean interval
  if (mean >= 25 && mean <= 32) {
    return { cadence: 'MONTHLY', regularity };
  } else if (mean >= 80 && mean <= 95) {
    return { cadence: 'QUARTERLY', regularity };
  } else if (mean >= 165 && mean <= 200) {
    return { cadence: 'BIANNUAL', regularity };
  } else if (mean >= 350 && mean <= 380) {
    return { cadence: 'ANNUAL', regularity };
  } else {
    return { cadence: 'IRREGULAR', regularity: 0 };
  }
}

/**
 * Calculate next due date based on last transaction and cadence
 */
function calculateNextDueDate(lastDate: string, cadence: string): string {
  const date = new Date(lastDate);

  switch (cadence) {
    case 'MONTHLY':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'QUARTERLY':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'BIANNUAL':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'ANNUAL':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      // For irregular, predict based on average interval
      date.setDate(date.getDate() + 30);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Calculate confidence score for detected subscription
 */
function calculateConfidence(
  transactionCount: number,
  amountVariance: number,
  regularity: number
): number {
  let score = 100;

  // Penalize low transaction counts
  if (transactionCount < 3) score -= 40;
  else if (transactionCount < 5) score -= 20;

  // Penalize high amount variance
  if (amountVariance > 0.2) score -= 30;
  else if (amountVariance > 0.1) score -= 15;

  // Bonus for high regularity
  score += regularity * 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Detect new subscriptions from transaction history
 */
export async function detectNewSubscriptions(): Promise<TServerResponse<DetectedSubscription[]>> {
  const auth = await isAuthenticated();
  if (!auth.success) return auth;

  const userId = auth.data.user.id;

  try {
    // Get transactions from last 90 days
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 90);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const transactions = await sqlClient`
      SELECT merchant_name, amount, transaction_date
      FROM transactions
      WHERE user_id = ${userId}
        AND transaction_date >= ${formatDate(dateFrom)}
        AND transaction_date <= ${formatDate(dateTo)}
      ORDER BY merchant_name, transaction_date DESC
    `;

    // Group transactions by merchant
    const grouped: Record<string, TransactionGroup> = {};

    for (const tx of transactions) {
      if (!grouped[tx.merchant_name]) {
        grouped[tx.merchant_name] = {
          merchantName: tx.merchant_name,
          transactions: [],
        };
      }
      grouped[tx.merchant_name].transactions.push({
        date: tx.transaction_date,
        amount: Number(tx.amount),
      });
    }

    const detected: DetectedSubscription[] = [];

    // Analyze each merchant group
    for (const group of Object.values(grouped)) {
      // Skip if less than 2 transactions
      if (group.transactions.length < 2) continue;

      const amounts = group.transactions.map((t) => t.amount);
      const dates = group.transactions.map((t) => t.date);

      // Calculate metrics
      const amountVariance = calculateVariance(amounts);
      const intervals = calculateIntervals(dates);
      const { cadence, regularity } = detectCadence(intervals);

      // Skip irregular patterns with no regularity
      if (cadence === 'IRREGULAR' && regularity < 0.5) continue;

      // Calculate confidence
      const confidence = calculateConfidence(group.transactions.length, amountVariance, regularity);

      // Only include if confidence >= 60
      if (confidence >= 60) {
        const lastDate = dates[0]; // Dates are sorted DESC in query
        detected.push({
          merchantName: group.merchantName,
          expectedAmount: amounts.reduce((a, b) => a + b, 0) / amounts.length,
          cadence,
          confidence,
          nextDueDate: calculateNextDueDate(lastDate, cadence),
          lastTransactionDate: lastDate,
          transactionCount: group.transactions.length,
        });
      }
    }

    // Sort by confidence descending
    detected.sort((a, b) => b.confidence - a.confidence);

    return {
      status: 200,
      success: true,
      data: detected,
    };
  } catch (error) {
    console.error('Failed to detect subscriptions:', error);
    return {
      status: 500,
      success: false,
      error: 'Kunne ikke detektere abonnementer',
    };
  }
}
