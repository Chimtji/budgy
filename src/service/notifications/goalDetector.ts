import type { TGoal } from '@/service/database/goals/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';
import { resolveGoalForMonth } from '@/stores/goals/goalsStore';

export type TGoalThreshold = 50 | 70 | 90 | 100;

export type TGoalNotification = {
  /** Stable ID: goal_threshold:{category_key}:{segment_key}:{threshold}:{YYYY-MM} */
  id: string;
  type: 'goal_threshold';
  threshold: TGoalThreshold;
  goalName: string;
  category_key: string;
  segment_key: string;
  amountLimit: number;
  spent: number;
  /** "YYYY-MM" */
  month: string;
};

const THRESHOLDS: TGoalThreshold[] = [50, 70, 90, 100];

/** Unique key for a (category, segment) slot */
const slotKey = (category_key: string, segment_key: string) => `${category_key}:${segment_key}`;

export function detectGoalNotifications(
  goals: TGoal[],
  transactions: TTransaction[],
  month: string
): TGoalNotification[] {
  const notifications: TGoalNotification[] = [];

  // Collect unique slots
  const seen = new Set<string>();
  const slots: { category_key: string; segment_key: string }[] = [];
  for (const g of goals) {
    const k = slotKey(g.category_key, g.segment_key);
    if (!seen.has(k)) {
      seen.add(k);
      slots.push({ category_key: g.category_key, segment_key: g.segment_key });
    }
  }

  // Build spending per slot for the given month
  const spendingMap: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.is_archived || tx.amount >= 0) continue;
    if (!tx.date.startsWith(month)) continue;
    const catKey = tx.category_key ?? '';
    const segKey = tx.segment_key ?? '';
    const amt = Math.abs(tx.amount);
    if (segKey) {
      spendingMap[slotKey(catKey, segKey)] = (spendingMap[slotKey(catKey, segKey)] ?? 0) + amt;
    }
    spendingMap[slotKey(catKey, '')] = (spendingMap[slotKey(catKey, '')] ?? 0) + amt;
  }

  for (const slot of slots) {
    const goal = resolveGoalForMonth(goals, slot.category_key, slot.segment_key, month);
    if (!goal || goal.amount_limit <= 0) continue;

    const k = slotKey(slot.category_key, slot.segment_key);
    const spent = spendingMap[k] ?? 0;
    const pct = (spent / goal.amount_limit) * 100;

    for (const threshold of THRESHOLDS) {
      if (pct >= threshold) {
        notifications.push({
          id: `goal_threshold:${slot.category_key}:${slot.segment_key}:${threshold}:${month}`,
          type: 'goal_threshold',
          threshold,
          goalName: goal.name,
          category_key: slot.category_key,
          segment_key: slot.segment_key,
          amountLimit: goal.amount_limit,
          spent,
          month,
        });
      }
    }
  }

  return notifications;
}
