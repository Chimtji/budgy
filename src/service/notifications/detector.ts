import type { TSubscriptionMatcher } from '@/service/database/subscriptions/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';
import {
  detectCadence,
  MAX_DAY_STDDEV,
  refineToSubscriptionTransactions,
  type TSubscriptionCadence,
} from '@/service/subscriptions/detector';

export type TNotificationType = 'subscription_price_change';

export type TNotification = {
  /** Stable ID derived from matcher + transaction — used for dismissal */
  id: string;
  type: TNotificationType;
  matcherId: string;
  subscriptionName: string;
  /** The expected price range midpoint (baseline average) */
  baselineAmount: number;
  /** The actual charged amount */
  chargedAmount: number;
  /** Positive = price increase, negative = decrease */
  delta: number;
  transaction: TTransaction;
};

/** Match by text/company only — deliberately ignores amount_min / amount_max */
function matchesText(t: TTransaction, matcher: TSubscriptionMatcher): boolean {
  const desc = (t.description ?? '').toLowerCase();
  const rawDesc = (t.raw_description ?? '').toLowerCase();
  const val = matcher.matcher_value.toLowerCase();

  switch (matcher.matcher_type) {
    case 'description_prefix':
      return desc.startsWith(val) || rawDesc.startsWith(val);
    case 'description_contains':
      return desc.includes(val) || rawDesc.includes(val);
    case 'company':
      return (t.company_name ?? '').toLowerCase() === val;
  }
}

/** Minimum absolute DKK change to qualify as a BS price step change */
const BS_STEP_MIN_ABS = 20;
/** Minimum relative change (1%) to qualify as a BS price step change */
const BS_STEP_MIN_REL = 0.01;
/** Number of recent charges to compare against the prior baseline */
const BS_STEP_WINDOW = 2;

/** Price change tolerance when no stored range exists — 5% deviation triggers a notification */
const DYNAMIC_PRICE_TOLERANCE = 0.05;

export function detectNotifications(
  transactions: TTransaction[],
  matchers: TSubscriptionMatcher[]
): TNotification[] {
  const notifications: TNotification[] = [];

  const active = transactions.filter((t) => !t.is_archived && t.category_key !== 'internal');

  for (const matcher of matchers) {
    // All text-matching charges for this matcher (shared by both BS and non-BS paths)
    const allMatched = active.filter((t) => t.amount < 0 && matchesText(t, matcher));
    if (allMatched.length < 2) continue;

    // BS: use step-change detection instead of outlier detection.
    // Compare the last BS_STEP_WINDOW charges vs all prior charges.
    // Fires once when the price has durably shifted at the new level.
    const isBS =
      matcher.matcher_type === 'description_prefix' &&
      matcher.matcher_value.toLowerCase().startsWith('bs ');
    if (isBS) {
      if (allMatched.length < BS_STEP_WINDOW + 2) continue;
      const sorted = [...allMatched].sort((a, b) => a.date.localeCompare(b.date));
      const recent = sorted.slice(-BS_STEP_WINDOW);
      const prior = sorted.slice(0, -BS_STEP_WINDOW);

      const priorAmounts = prior.map((t) => Math.abs(t.amount)).sort((a, b) => a - b);
      const priorMid = Math.floor(priorAmounts.length / 2);
      const priorMedian =
        priorAmounts.length % 2 === 0
          ? (priorAmounts[priorMid - 1] + priorAmounts[priorMid]) / 2
          : priorAmounts[priorMid];

      const recentMean = recent.reduce((s, t) => s + Math.abs(t.amount), 0) / recent.length;
      const delta = recentMean - priorMedian;
      const relChange = Math.abs(delta) / priorMedian;

      if (relChange >= BS_STEP_MIN_REL && Math.abs(delta) >= BS_STEP_MIN_ABS) {
        const firstNew = recent[0];
        notifications.push({
          id: `bs_price_change:${matcher.id}:${firstNew.id}`,
          type: 'subscription_price_change',
          matcherId: matcher.id,
          subscriptionName: matcher.name,
          baselineAmount: Math.round(priorMedian),
          chargedAmount: Math.round(recentMean),
          delta: Math.round(delta),
          transaction: firstNew,
        });
      }
      continue;
    }

    const cadence: TSubscriptionCadence = matcher.cadence ?? detectCadence(allMatched);

    let amountMin: number;
    let amountMax: number;

    if (matcher.amount_min != null && matcher.amount_max != null) {
      // Use the stored confirmed range
      amountMin = matcher.amount_min;
      amountMax = matcher.amount_max;
    } else {
      // Derive baseline dynamically from the transaction history via median
      const amounts = allMatched.map((t) => Math.abs(t.amount)).sort((a, b) => a - b);
      const mid = Math.floor(amounts.length / 2);
      const median =
        amounts.length % 2 === 0 ? (amounts[mid - 1] + amounts[mid]) / 2 : amounts[mid];
      amountMin = median * (1 - DYNAMIC_PRICE_TOLERANCE);
      amountMax = median * (1 + DYNAMIC_PRICE_TOLERANCE);
    }

    const baseline = (amountMin + amountMax) / 2;

    // Transactions within the expected range — define the normal charge day window
    const normalMatched = allMatched.filter(
      (t) => Math.abs(t.amount) >= amountMin && Math.abs(t.amount) <= amountMax
    );
    if (normalMatched.length < 2) continue;

    // Derive the expected charge day from the clean baseline set
    const baselineDays = normalMatched.map((t) => parseInt(t.date.split('-')[2], 10));
    const sortedDays = [...baselineDays].sort((a, b) => a - b);
    const mid = Math.floor(sortedDays.length / 2);
    const medianDay =
      sortedDays.length % 2 === 0 ? (sortedDays[mid - 1] + sortedDays[mid]) / 2 : sortedDays[mid];

    // Transactions outside the expected amount range
    const anomalies = allMatched.filter(
      (t) => Math.abs(t.amount) < amountMin || Math.abs(t.amount) > amountMax
    );
    if (anomalies.length === 0) continue;

    // Deduplicate anomalies by period and filter to only those on the expected charge day
    const refinedAnomalies = refineToSubscriptionTransactions(anomalies, cadence).filter((t) => {
      const day = parseInt(t.date.split('-')[2], 10);
      return Math.abs(day - medianDay) <= MAX_DAY_STDDEV;
    });

    for (const t of refinedAnomalies) {
      const abs = Math.abs(t.amount);
      notifications.push({
        id: `price_change:${matcher.id}:${t.id}`,
        type: 'subscription_price_change',
        matcherId: matcher.id,
        subscriptionName: matcher.name,
        baselineAmount: baseline,
        chargedAmount: abs,
        delta: abs - baseline,
        transaction: t,
      });
    }
  }

  // Most recent anomaly first
  return notifications.sort((a, b) => b.transaction.date.localeCompare(a.transaction.date));
}
