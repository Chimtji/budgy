import type { TSubscriptionMatcher } from '@/service/database/subscriptions/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';

export type TSubscriptionCadence =
  | 'monthly'
  | 'bi-monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly'
  | 'irregular';

export type TDetectedSubscription = {
  key: string;
  name: string;
  source: 'bs' | 'recurring' | 'manual';
  matcherType: TSubscriptionMatcher['matcher_type'] | 'bs_auto' | 'company_auto';
  matcherValue: string;
  transactions: TTransaction[];
  cadence: TSubscriptionCadence;
  estimatedMonthly: number;
  lastChargedDate: string;
  isManual: boolean;
  manualMatcherId?: string;
  note?: string | null;
};

export const CADENCE_LABELS: Record<TSubscriptionCadence, string> = {
  monthly: 'Månedlig',
  'bi-monthly': 'Hver 2. måned',
  quarterly: 'Kvartalsvis',
  'half-yearly': 'Halvårlig',
  yearly: 'Årlig',
  irregular: 'Uregelmæssig',
};

export const CADENCE_OPTIONS: { value: TSubscriptionCadence; label: string }[] = [
  { value: 'monthly', label: 'Månedlig' },
  { value: 'bi-monthly', label: 'Hver 2. måned' },
  { value: 'quarterly', label: 'Kvartalsvis' },
  { value: 'half-yearly', label: 'Halvårlig' },
  { value: 'yearly', label: 'Årlig' },
  { value: 'irregular', label: 'Uregelmæssig' },
];

/** Months per period for each cadence */
const CADENCE_MONTHS: Record<TSubscriptionCadence, number> = {
  monthly: 1,
  'bi-monthly': 2,
  quarterly: 3,
  'half-yearly': 6,
  yearly: 12,
  irregular: 1, // fall back to raw average
};

/** Snap a median interval (days) to the closest named cadence */
function snapCadence(medianDays: number): TSubscriptionCadence {
  const buckets: { cadence: TSubscriptionCadence; center: number; tolerance: number }[] = [
    { cadence: 'monthly', center: 30, tolerance: 12 },
    { cadence: 'bi-monthly', center: 61, tolerance: 15 },
    { cadence: 'quarterly', center: 91, tolerance: 14 },
    { cadence: 'half-yearly', center: 182, tolerance: 35 },
    { cadence: 'yearly', center: 365, tolerance: 45 },
  ];
  for (const { cadence, center, tolerance } of buckets) {
    if (Math.abs(medianDays - center) <= tolerance) return cadence;
  }
  return 'irregular';
}

export function detectCadence(
  transactions: TTransaction[],
  dataSpanDays?: number
): TSubscriptionCadence {
  const sorted = [...transactions]
    .filter((t) => t.amount < 0)
    .map((t) => t.date)
    .sort();
  if (sorted.length < 2) {
    if (sorted.length === 1 && dataSpanDays !== undefined && dataSpanDays >= 330) return 'yearly';
    return 'irregular';
  }

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days =
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  const mid = Math.floor(intervals.length / 2);
  const sorted_intervals = [...intervals].sort((a, b) => a - b);
  const median =
    sorted_intervals.length % 2 === 0
      ? (sorted_intervals[mid - 1] + sorted_intervals[mid]) / 2
      : sorted_intervals[mid];

  return snapCadence(median);
}

export function estimateMonthly(
  transactions: TTransaction[],
  cadence: TSubscriptionCadence
): number {
  const expenses = transactions.filter((t) => t.amount < 0);
  if (expenses.length === 0) return 0;

  if (cadence === 'irregular') {
    // Fall back to total / distinct months
    const months = new Set(expenses.map((t) => t.date.slice(0, 7))).size;
    const total = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    return Math.round(total / Math.max(months, 1));
  }

  // Average charge amount / months per cadence period
  const avgCharge = expenses.reduce((s, t) => s + Math.abs(t.amount), 0) / expenses.length;
  return Math.round(avgCharge / CADENCE_MONTHS[cadence]);
}

const MONTHS_WINDOW = 13;
const MIN_RECURRING_MONTHS = 3;
const MAX_CV_RECURRING = 0;
const AMOUNT_CLUSTER_TOLERANCE = 0; // exact same amount — prevents different purchases polluting the cluster

/** Coefficient of variation of absolute amounts — 0 means all identical */
function coefficientOfVariation(amounts: number[]): number {
  if (amounts.length < 2) return 0;
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  if (mean === 0) return 0;
  const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
  return Math.sqrt(variance) / mean;
}

function matchesMatcher(t: TTransaction, matcher: TSubscriptionMatcher): boolean {
  const desc = (t.description ?? '').toLowerCase();
  const rawDesc = (t.raw_description ?? '').toLowerCase();
  const val = matcher.matcher_value.toLowerCase();

  let textMatch = false;
  switch (matcher.matcher_type) {
    case 'description_prefix':
      textMatch = desc.startsWith(val) || rawDesc.startsWith(val);
      break;
    case 'description_contains':
      textMatch = desc.includes(val) || rawDesc.includes(val);
      break;
    case 'company':
      textMatch = (t.company_name ?? '').toLowerCase() === val;
      break;
  }
  if (!textMatch) return false;

  // BS payments vary by nature — skip amount range enforcement unless an explicit
  // range was set (i.e. the user created a split matcher to isolate one policy).
  const isBS =
    matcher.matcher_type === 'description_prefix' &&
    matcher.matcher_value.toLowerCase().startsWith('bs ');
  const hasPinnedRange = matcher.amount_min != null && matcher.amount_max != null;
  if (!isBS || hasPinnedRange) {
    const abs = Math.abs(t.amount);
    if (matcher.amount_min != null && abs < matcher.amount_min) return false;
    if (matcher.amount_max != null && abs > matcher.amount_max) return false;
  }
  return true;
}

/**
 * Groups transactions into clusters where each cluster contains transactions
 * with similar absolute amounts (within `relTolerance` of the cluster mean).
 */
function clusterByAmount(txns: TTransaction[], relTolerance: number): TTransaction[][] {
  const sorted = [...txns].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
  const clusters: TTransaction[][] = [];

  for (const t of sorted) {
    const abs = Math.abs(t.amount);
    let placed = false;
    for (const cluster of clusters) {
      const mean = cluster.reduce((s, c) => s + Math.abs(c.amount), 0) / cluster.length;
      if (mean > 0 && Math.abs(abs - mean) / mean <= relTolerance) {
        cluster.push(t);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([t]);
  }

  return clusters;
}

const MIN_DESCRIPTION_DOMINANCE = 0.6; // 60% of txns must share the same description prefix

/**
 * Returns true if ≥ 70% of transactions share the same leading description word(s).
 * Prevents random same-company shopping trips from being flagged as subscriptions.
 */
function hasConsistentDescription(txns: TTransaction[]): boolean {
  if (txns.length < 2) return true;
  const normalize = (t: TTransaction) =>
    (t.description ?? t.raw_description ?? '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
  const freq = new Map<string, number>();
  for (const t of txns) {
    const key = normalize(t);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const topCount = Math.max(...freq.values());
  return topCount / txns.length >= MIN_DESCRIPTION_DOMINANCE;
}

/** Returns a period bucket string for a date given a cadence */
function periodBucket(date: string, cadence: TSubscriptionCadence): string {
  const [year, month] = date.split('-').map(Number);
  switch (cadence) {
    case 'monthly':
      return `${year}-${month}`;
    case 'bi-monthly':
      return `${year}-B${Math.ceil(month / 2)}`;
    case 'quarterly':
      return `${year}-Q${Math.ceil(month / 3)}`;
    case 'half-yearly':
      return `${year}-H${month <= 6 ? 1 : 2}`;
    case 'yearly':
      return `${year}`;
    default:
      return date;
  }
}

export const MAX_DAY_STDDEV = 10; // days — how spread the charge day can be across months

/**
 * Returns true if the cluster fits the cadence cleanly (pre-check for detection):
 * - At most one transaction per cadence period
 * - The day-of-month is consistent (stddev ≤ MAX_DAY_STDDEV days)
 */
function isValidCandidateGroup(txns: TTransaction[], cadence: TSubscriptionCadence): boolean {
  if (cadence === 'irregular') return false;

  // One transaction per period
  const periods = txns.map((t) => periodBucket(t.date, cadence));
  if (new Set(periods).size !== periods.length) return false;

  // Consistent day of month
  const days = txns.map((t) => parseInt(t.date.split('-')[2], 10));
  const mean = days.reduce((s, d) => s + d, 0) / days.length;
  const stddev = Math.sqrt(days.reduce((s, d) => s + (d - mean) ** 2, 0) / days.length);
  if (stddev > MAX_DAY_STDDEV) return false;

  return true;
}

/**
 * Keeps only the latest transaction per cadence period.
 * Prevents one-off purchases (e.g. a game buy on the same company) from being included
 * alongside the real subscription charge in the same month.
 */
function deduplicateByPeriod(txns: TTransaction[], cadence: TSubscriptionCadence): TTransaction[] {
  if (cadence === 'irregular') return txns;
  const byPeriod = new Map<string, TTransaction>();
  for (const t of txns) {
    const period = periodBucket(t.date, cadence);
    const existing = byPeriod.get(period);
    if (!existing || t.date > existing.date) {
      byPeriod.set(period, t);
    }
  }
  return [...byPeriod.values()];
}

/**
 * Filters transactions to those whose day-of-month is within MAX_DAY_STDDEV of the median charge day.
 * Needs at least 2 transactions to establish a baseline; otherwise returns as-is.
 */
function filterByChargeDay(txns: TTransaction[]): TTransaction[] {
  if (txns.length < 2) return txns;
  const days = txns.map((t) => parseInt(t.date.split('-')[2], 10));
  const sorted = [...days].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return txns.filter((t) => {
    const day = parseInt(t.date.split('-')[2], 10);
    return Math.abs(day - median) <= MAX_DAY_STDDEV;
  });
}
/**
 * Canonical single source of truth: deduplicates by period, then filters by consistent charge day.
 * Used by ALL three detection sections and confirmed subscription matchers to ensure identical rules.
 */
export function refineToSubscriptionTransactions(
  txns: TTransaction[],
  cadence: TSubscriptionCadence
): TTransaction[] {
  return filterByChargeDay(deduplicateByPeriod(txns, cadence));
}
export function detectSubscriptions(
  transactions: TTransaction[],
  matchers: TSubscriptionMatcher[]
): TDetectedSubscription[] {
  const active = transactions.filter((t) => !t.is_archived && t.category_key !== 'internal');

  const allDates = active.map((t) => t.date).sort();
  const dataSpanDays =
    allDates.length >= 2
      ? (new Date(allDates.at(-1)!).getTime() - new Date(allDates[0]).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS_WINDOW);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = active.filter((t) => t.date >= cutoffStr);

  const results = new Map<string, TDetectedSubscription>();

  // ── 1. Manual matchers (highest priority) ──────────────────────────────
  for (const matcher of matchers) {
    const matched = active.filter((t) => t.amount < 0 && matchesMatcher(t, matcher));
    if (matched.length === 0) continue;

    const isBS =
      matcher.matcher_type === 'description_prefix' &&
      matcher.matcher_value.toLowerCase().startsWith('bs ');

    // For manual matchers the user already specified exactly what to match —
    // trust the matcher and use all matched transactions. Amount clustering here
    // causes false negatives when a subscription fee changes over time.
    const baseCluster = matched;

    const cadence: TSubscriptionCadence =
      matcher.cadence ?? detectCadence(baseCluster, dataSpanDays);
    // For manual matchers, skip charge-day filtering — the user has explicitly defined what to
    // match, so we trust the matcher and only deduplicate by period to avoid double-counting.
    const refined = deduplicateByPeriod(baseCluster, cadence);
    if (refined.length === 0) continue;
    const key = `manual:${matcher.id}`;
    results.set(key, {
      key,
      name: matcher.name,
      source: 'manual',
      matcherType: matcher.matcher_type,
      matcherValue: matcher.matcher_value,
      cadence,
      transactions: refined.sort((a, b) => b.date.localeCompare(a.date)),
      estimatedMonthly: estimateMonthly(refined, cadence),
      lastChargedDate: refined
        .map((t) => t.date)
        .sort()
        .at(-1)!,
      isManual: true,
      manualMatcherId: matcher.id,
      note: matcher.note ?? null,
    });
  }

  /** Danish and English month names — used to detect where variable date content begins in BS descriptions */
  const MONTH_NAMES = new Set([
    'januar',
    'februar',
    'marts',
    'april',
    'maj',
    'juni',
    'juli',
    'august',
    'september',
    'oktober',
    'november',
    'december',
    'january',
    'february',
    'march',
    'june',
    'july',
    'october',
  ]);

  /**
   * Extracts a stable group key from a raw BS description.
   *
   * BS descriptions embed variable data (date ranges, amounts, invoice numbers)
   * after the creditor name. We normalise in three passes:
   *
   * 1. Strip the leading "BS " prefix.
   * 2. Split on the first separator token (` – `, ` - `, ` / `, ` | `). Take stable words
   *    from BOTH sides: up to 5 from the name before the separator, then up to 3 stable
   *    words from after it. This distinguishes "HILLERØD KOMMUNE – DAGINSTITUTION" from
   *    "HILLERØD KOMMUNE – EJENDOMSBIDRAG", while "A-KASSE – 1. APRIL" still gives only
   *    the safe left side because the right side starts with an ordinal.
   * 3. Stop-at-variable rule applied to each side: pure numbers, ordinals (e.g. "1."),
   * Returns up to 6 clean letter-based words joined with spaces (lowercased).
   */
  function extractBSGroupKey(rawDescription: string): string {
    // 0. If a customer number is present, use it as the primary stable key.
    //    Patterns: "KUNDENR. 12345", "KUNDENR: 12345", "KUNDE NR. 12345"
    const kundenrMatch = rawDescription.match(/KUNDE(?:NR\.?|R\.?|R:)\s*(\d+)/i);
    if (kundenrMatch) {
      return `kundenr:${kundenrMatch[1]}`;
    }

    // 1. Strip "BS " prefix
    const afterPrefix = rawDescription.replace(/^BS\s+/i, '').trim();

    // 2. Split on first hard separator — take name before AND stable words after.
    //    This handles creditors like "HILLERØD KOMMUNE" that serve multiple services,
    //    where the service type lives after the separator (e.g. "– DAGINSTITUTION" vs "– EJENDOMSBIDRAG").
    const separatorMatch = afterPrefix.match(/^(.+?)\s+[–\-\/|]\s+(.*)$/);
    const nameSegment = separatorMatch ? separatorMatch[1] : afterPrefix;
    const afterSeparator = separatorMatch ? separatorMatch[2] : '';

    const extractStableWords = (text: string, limit: number): string[] => {
      const words: string[] = [];
      for (const word of text.split(/\s+/)) {
        const w = word.replace(/[.,;:!?]+$/, '');
        if (/^\d+$/.test(w)) break;
        if (/^\d+\.$/.test(word)) break; // ordinal like "1."
        if (/^(19|20)\d{2}$/.test(w)) break; // year
        if (MONTH_NAMES.has(w.toLowerCase())) break;
        if (/[a-zA-ZÆØÅæøå]/.test(w)) words.push(w.toLowerCase());
        if (words.length >= limit) break;
      }
      return words;
    };

    // Up to 5 words from the name before the separator, then up to 3 stable words after it
    const stableWords = [
      ...extractStableWords(nameSegment, 5),
      ...extractStableWords(afterSeparator, 3),
    ];

    return stableWords.join(' ');
  }

  // Collect IDs of all transactions already claimed by a manual matcher so
  // auto-detection doesn't re-use them in a detected group.
  const claimedIds = new Set<string>(
    [...results.values()].flatMap((s) => s.transactions.map((t) => t.id))
  );

  const bsTransactions = recent.filter(
    (t) =>
      !claimedIds.has(t.id) &&
      t.amount < 0 &&
      ((t.description ?? '').toUpperCase().startsWith('BS ') ||
        (t.raw_description ?? '').toUpperCase().startsWith('BS '))
  );

  const bsByName = new Map<string, TTransaction[]>();
  for (const t of bsTransactions) {
    const src = (t.description ?? '').toUpperCase().startsWith('BS ')
      ? t.description
      : t.raw_description;
    const groupKey = extractBSGroupKey(src ?? '');
    if (!groupKey) continue;
    if (!bsByName.has(groupKey)) bsByName.set(groupKey, []);
    bsByName.get(groupKey)!.push(t);
  }

  for (const [groupKey, txns] of bsByName) {
    const key = `bs:${groupKey}`;
    if ([...results.values()].some((r) => txns.every((t) => r.transactions.includes(t)))) continue;
    // Need at least 2 transactions to confirm a recurring pattern.
    // No CV/amount check — BS amounts vary legitimately; step-change notifications handle shifts.

    const cadence = detectCadence(txns, dataSpanDays);
    // For BS, use period-deduplication to avoid counting the same charge twice —
    // UNLESS any period contains multiple transactions with meaningfully different
    // amounts, which signals multiple distinct policies from the same creditor.
    // In that case skip deduplication so the user can see all transactions to split.
    const byPeriod = new Map<string, TTransaction[]>();
    for (const t of txns) {
      const p = periodBucket(t.date, cadence);
      if (!byPeriod.has(p)) byPeriod.set(p, []);
      byPeriod.get(p)!.push(t);
    }
    const hasMultiplePoliciesInPeriod = [...byPeriod.values()].some((pts) => {
      if (pts.length < 2) return false;
      const amounts = pts.map((t) => Math.abs(t.amount));
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      return (max - min) / min > 0.05; // >5% difference → distinct policies
    });
    const refined = hasMultiplePoliciesInPeriod ? txns : deduplicateByPeriod(txns, cadence);
    if (refined.length === 0) continue;
    const displayName =
      txns[0].company_name ??
      (() => {
        if (groupKey.startsWith('kundenr:')) {
          // Extract the creditor name from the first transaction's description
          const src = (txns[0].description ?? txns[0].raw_description ?? '')
            .replace(/^BS\s+/i, '')
            .trim();
          const nameSegment = src.split(/\s+[–\-\/|]\s+/)[0].trim();
          return nameSegment || groupKey;
        }
        // Capitalise the stable group key — it's already stripped of variable content
        return groupKey
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      })();
    results.set(key, {
      key,
      name: displayName,
      source: 'bs',
      matcherType: 'bs_auto',
      matcherValue: groupKey,
      cadence,
      transactions: refined.sort((a, b) => b.date.localeCompare(a.date)),
      estimatedMonthly: estimateMonthly(refined, cadence),
      lastChargedDate: refined
        .map((t) => t.date)
        .sort()
        .at(-1)!,
      isManual: false,
    });
  }

  // ── 3. Recurring by company or description prefix — cluster by amount, 3+ distinct months ─
  const byCompany = new Map<string, { groupName: string; txns: TTransaction[] }>();
  for (const t of recent) {
    if (t.amount >= 0) continue;
    if (claimedIds.has(t.id)) continue;
    let groupKey: string;
    let groupName: string;
    if (t.company_name) {
      groupKey = `company:${t.company_name.toLowerCase()}`;
      groupName = t.company_name;
    } else {
      const desc = (t.description ?? t.raw_description ?? '').trim();
      if (!desc) continue;
      // Use the first 3 words of the description as the grouping key
      const prefix = desc.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      groupKey = `desc:${prefix}`;
      groupName = desc.split(/\s+/).slice(0, 3).join(' ');
    }
    if (!byCompany.has(groupKey)) byCompany.set(groupKey, { groupName, txns: [] });
    byCompany.get(groupKey)!.txns.push(t);
  }

  for (const [companyKey, { groupName, txns }] of byCompany) {
    // Cluster transactions by similar absolute amount (within AMOUNT_CLUSTER_TOLERANCE)
    const clusters = clusterByAmount(txns, AMOUNT_CLUSTER_TOLERANCE);

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const distinctMonths = new Set(cluster.map((t) => t.date.slice(0, 7))).size;
      if (distinctMonths < MIN_RECURRING_MONTHS) continue;

      const clusterAmounts = cluster.map((t) => Math.abs(t.amount));
      if (coefficientOfVariation(clusterAmounts) > MAX_CV_RECURRING) continue;

      // Require consistent descriptions — real subscriptions repeat the same text
      if (!hasConsistentDescription(cluster)) continue;

      const cadence = detectCadence(cluster, dataSpanDays);
      if (!isValidCandidateGroup(cluster, cadence)) continue;
      const refined = refineToSubscriptionTransactions(cluster, cadence);
      if (refined.length < MIN_RECURRING_MONTHS) continue;

      const key = `company:${companyKey}:${i}`;
      if (
        [...results.values()].some(
          (r) =>
            (r.matcherType === 'company' || r.matcherType === 'company_auto') &&
            r.matcherValue.toLowerCase() === companyKey
        )
      )
        continue;
      if (refined.every((t) => [...results.values()].some((r) => r.transactions.includes(t))))
        continue;
      results.set(key, {
        key,
        name: groupName,
        source: 'recurring',
        matcherType: 'company_auto',
        matcherValue: companyKey,
        cadence,
        transactions: refined.sort((a, b) => b.date.localeCompare(a.date)),
        estimatedMonthly: estimateMonthly(refined, cadence),
        lastChargedDate: refined
          .map((t) => t.date)
          .sort()
          .at(-1)!,
        isManual: false,
      });
    }
  }

  return [...results.values()].sort((a, b) => b.estimatedMonthly - a.estimatedMonthly);
}
