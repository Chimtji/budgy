'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconAdjustments,
  IconArrowBack,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconEyeOff,
  IconNote,
  IconPlus,
  IconScissors,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  HoverCard,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { type TTransaction } from '@/service/database/transactions/getAll';
import {
  CADENCE_OPTIONS,
  detectSubscriptions,
  estimateMonthly,
  refineToSubscriptionTransactions,
  type TDetectedSubscription,
  type TSubscriptionCadence,
} from '@/service/subscriptions/detector';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { formatDate } from '@/utilities';
import CompanyLogo from '../../companies/_components/CompanyLogo';
import TransactionDrawer from '../../transactions/_components/TransactionDrawer';

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const CADENCE_PERIOD_LABEL: Record<string, string> = {
  monthly: 'md.',
  'bi-monthly': '2 md.',
  quarterly: 'kvartal',
  'half-yearly': 'halvår',
  yearly: 'år',
  irregular: 'opkrævning',
};

function latestChargeAmount(sub: TDetectedSubscription): number {
  const expenses = sub.transactions
    .filter((t) => t.amount < 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (expenses.length === 0) return 0;
  return Math.abs(expenses[0].amount);
}

const SOURCE_LABELS: Record<string, string> = {
  bs: 'Betalingsservice',
  recurring: 'Gengående betaling',
};

const SOURCE_COLORS: Record<string, string> = {
  bs: 'violet',
  recurring: 'teal',
};

const CADENCE_PERIOD_DAYS: Record<TSubscriptionCadence, number> = {
  monthly: 30,
  'bi-monthly': 61,
  quarterly: 91,
  'half-yearly': 182,
  yearly: 365,
  irregular: 30,
};

type TSubscriptionStatus = 'active' | 'tentative' | 'cancelled';

function getSubscriptionStatus(
  sub: TDetectedSubscription,
  cadence: TSubscriptionCadence
): TSubscriptionStatus {
  const periodDays = CADENCE_PERIOD_DAYS[cadence];
  const daysSince = (Date.now() - new Date(sub.lastChargedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= periodDays * 1.5) return 'active';
  if (daysSince <= periodDays * 2.5) return 'tentative';
  return 'cancelled';
}

const STATUS_BADGE: Record<TSubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'green' },
  tentative: { label: 'Usikker', color: 'orange' },
  cancelled: { label: 'Afsluttet', color: 'red' },
};

function getSourceBadge(sub: TDetectedSubscription): { label: string; color: string } | null {
  if (sub.source === 'bs') return { label: 'Betalingsservice', color: 'violet' };
  if (sub.source === 'recurring') return { label: 'Gengående', color: 'teal' };
  // Confirmed BS: description_prefix matcher with value starting with 'bs '
  if (
    sub.source === 'manual' &&
    sub.matcherType === 'description_prefix' &&
    sub.matcherValue.toLowerCase().startsWith('bs ')
  ) {
    return { label: 'Betalingsservice', color: 'violet' };
  }
  return null;
}

function resolveConfirmArgs(sub: TDetectedSubscription): {
  matcherType: 'description_prefix' | 'company';
  matcherValue: string;
  amountMin: number | null;
  amountMax: number | null;
} {
  const amounts = sub.transactions.map((t) => Math.abs(t.amount));
  // Allow ±2% wiggle for confirmed matchers to handle minor rounding
  const avg = amounts.reduce((s, v) => s + v, 0) / (amounts.length || 1);
  const amountMin = sub.matcherType === 'bs_auto' ? null : Math.floor(avg * 0.98);
  const amountMax = sub.matcherType === 'bs_auto' ? null : Math.ceil(avg * 1.02);
  if (sub.matcherType === 'bs_auto') {
    // Derive the prefix from the actual description so startsWith() matching works.
    // Take the first transaction's description, strip "BS " prefix, split on the
    // separator — use everything up to (and including) the separator + stable suffix.
    // Simpler: use "BS " + the name segment before the separator (lowercased).
    const firstDesc = (
      sub.transactions[0]?.description ??
      sub.transactions[0]?.raw_description ??
      ''
    ).trim();
    const afterBS = firstDesc.replace(/^BS\s+/i, '');
    // Find the longest common prefix across all transactions' descriptions,
    // so the matcher covers the stable name portion only.
    const descs = sub.transactions.map((t) =>
      (t.description ?? t.raw_description ?? '').replace(/^BS\s+/i, '').toLowerCase()
    );
    const lcp = descs.reduce((a, b) => {
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      return a.slice(0, i);
    }, descs[0] ?? afterBS.toLowerCase());
    // Trim any trailing whitespace / separator chars for a clean prefix
    const matcherValue = `bs ${lcp.replace(/[\s–\-\/|]+$/, '').trim()}`;
    return { matcherType: 'description_prefix', matcherValue, amountMin, amountMax };
  }
  if (sub.matcherValue.startsWith('company:')) {
    return {
      matcherType: 'company',
      matcherValue: sub.matcherValue.slice('company:'.length),
      amountMin,
      amountMax,
    };
  }
  if (sub.matcherValue.startsWith('desc:')) {
    return {
      matcherType: 'description_prefix',
      matcherValue: sub.matcherValue.slice('desc:'.length),
      amountMin,
      amountMax,
    };
  }
  return { matcherType: 'company', matcherValue: sub.matcherValue, amountMin, amountMax };
}

type TFilter = 'confirmed' | 'detected' | 'ignored';

const filterTabStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  background: active ? 'var(--mantine-color-violet-0)' : 'transparent',
  color: active ? 'var(--mantine-color-violet-7)' : 'var(--mantine-color-gray-6)',
  border: 'none',
});

export default function SubscriptionsListPage() {
  const {
    matchers,
    ignoredDetectionKeys,
    init: initMatchers,
    confirmDetection,
    removeMatcher,
    setCadence,
    setNote,
    setAmountRange,
    ignoreDetection,
    unignoreDetection,
  } = useSubscriptionsStore(
    useShallow((s) => ({
      matchers: s.matchers,
      ignoredDetectionKeys: s.ignoredDetectionKeys,
      init: s.init,
      confirmDetection: s.confirmDetection,
      removeMatcher: s.removeMatcher,
      setCadence: s.setCadence,
      setNote: s.setNote,
      setAmountRange: s.setAmountRange,
      ignoreDetection: s.ignoreDetection,
      unignoreDetection: s.unignoreDetection,
    }))
  );
  const {
    transactions,
    isLoading,
    init: initTxns,
  } = useTransactionsStore(
    useShallow((s) => ({ transactions: s.transactions, isLoading: s.isLoading, init: s.init }))
  );

  const { categories, segments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );

  const [filter, setFilter] = useState<TFilter>('confirmed');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [drawerTransaction, setDrawerTransaction] = useState<TTransaction | null>(null);
  const [cancelledExpanded, setCancelledExpanded] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [detectedCadenceOverrides, setDetectedCadenceOverrides] = useState<
    Record<string, TSubscriptionCadence>
  >({});
  const [splitSelection, setSplitSelection] = useState<string[]>([]);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitName, setSplitName] = useState('');
  const [splitMedianAmount, setSplitMedianAmount] = useState(0);
  const [splitTolerance, setSplitTolerance] = useState<number | string>(10);
  const [splittingConfirm, setSplittingConfirm] = useState(false);
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [missingSearch, setMissingSearch] = useState('');
  const [missingSelection, setMissingSelection] = useState<string[]>([]);
  const [missingTolerance, setMissingTolerance] = useState<number | string>(10);
  const [savingRange, setSavingRange] = useState(false);
  const [detectedExtraIds, setDetectedExtraIds] = useState<Record<string, string[]>>({});
  const [detectedTolerances, setDetectedTolerances] = useState<Record<string, number>>({});

  const getEffectiveCadence = (sub: TDetectedSubscription): TSubscriptionCadence =>
    sub.source !== 'manual' && detectedCadenceOverrides[sub.key]
      ? detectedCadenceOverrides[sub.key]
      : sub.cadence;

  const getEffectiveMonthly = (sub: TDetectedSubscription): number => {
    const cadence = getEffectiveCadence(sub);
    return cadence === sub.cadence
      ? sub.estimatedMonthly
      : estimateMonthly(sub.transactions, cadence);
  };

  useEffect(() => {
    initMatchers();
    initTxns({});
  }, []);

  useEffect(() => {
    setSplitSelection([]);
    setMissingSelection([]);
  }, [selectedKey]);

  const allSubscriptions = useMemo(
    () => detectSubscriptions(transactions, matchers),
    [transactions, matchers]
  );

  const confirmed = useMemo(
    () => allSubscriptions.filter((s) => s.source === 'manual'),
    [allSubscriptions]
  );

  const detected = useMemo(
    () =>
      allSubscriptions.filter(
        (s) => s.source !== 'manual' && !ignoredDetectionKeys.includes(s.key)
      ),
    [allSubscriptions, ignoredDetectionKeys]
  );

  const ignored = useMemo(
    () =>
      allSubscriptions.filter((s) => s.source !== 'manual' && ignoredDetectionKeys.includes(s.key)),
    [allSubscriptions, ignoredDetectionKeys]
  );

  const STATUS_SORT: Record<TSubscriptionStatus, number> = {
    active: 0,
    tentative: 1,
    cancelled: 2,
  };

  const rawList = filter === 'confirmed' ? confirmed : filter === 'detected' ? detected : ignored;
  const list = [...rawList].sort(
    (a, b) =>
      STATUS_SORT[getSubscriptionStatus(a, getEffectiveCadence(a))] -
      STATUS_SORT[getSubscriptionStatus(b, getEffectiveCadence(b))]
  );
  const selectedSub =
    list.find((s) => s.key === selectedKey) ??
    (filter === 'ignored' ? ignored.find((s) => s.key === selectedKey) : null) ??
    null;

  const missingCandidates = useMemo(() => {
    if (!selectedSub) return [];
    const extraIds = detectedExtraIds[selectedSub.key] ?? [];
    const currentIds = new Set([...selectedSub.transactions.map((t) => t.id), ...extraIds]);
    return transactions
      .filter((t) => !t.is_archived && t.amount < 0 && !currentIds.has(t.id))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedSub, transactions, detectedExtraIds]);

  const displayTransactions = useMemo(() => {
    if (!selectedSub) return [];
    const extraIds = detectedExtraIds[selectedSub.key] ?? [];
    const cadence = getEffectiveCadence(selectedSub);
    const allTxns = [
      ...selectedSub.transactions,
      ...transactions.filter((t) => extraIds.includes(t.id)),
    ];
    // For confirmed (manual) subs, always filter by cadence for 1:1 parity
    if (selectedSub.source === 'manual') {
      return refineToSubscriptionTransactions(allTxns, cadence).sort((a, b) =>
        b.date.localeCompare(a.date)
      );
    }
    // For detected, keep previous logic
    return allTxns.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedSub, detectedExtraIds, transactions]);

  const filteredMissingCandidates = useMemo(() => {
    if (!missingSearch.trim()) return missingCandidates;
    const q = missingSearch.toLowerCase();
    return missingCandidates.filter(
      (t) =>
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.company_name ?? '').toLowerCase().includes(q)
    );
  }, [missingCandidates, missingSearch]);

  const handleMissingConfirm = async () => {
    if (!selectedSub || missingSelection.length === 0) return;
    setSavingRange(true);
    const selectedTxns = missingCandidates.filter((t) => missingSelection.includes(t.id));
    const allAmounts = [
      ...displayTransactions.map((t) => Math.abs(t.amount)),
      ...selectedTxns.map((t) => Math.abs(t.amount)),
    ];
    const rangeMin = Math.min(...allAmounts);
    const rangeMax = Math.max(...allAmounts);
    const tol = typeof missingTolerance === 'number' ? missingTolerance / 100 : 0.1;
    const amountMin = Math.floor(rangeMin * (1 - tol));
    const amountMax = Math.ceil(rangeMax * (1 + tol));

    if (selectedSub.manualMatcherId) {
      // Confirmed sub — update the existing matcher's range
      await setAmountRange(selectedSub.manualMatcherId, amountMin, amountMax);
      setSavingRange(false);
      setMissingModalOpen(false);
      setMissingSelection([]);
      setMissingSearch('');
      showSuccessNotification({
        title: 'Opdateret',
        message: 'Beløbsinterval er udvidet til at inkludere de valgte posteringer',
      });
    } else {
      // Detected sub — store extras + tolerance locally; user confirms the sub afterwards
      const tol = typeof missingTolerance === 'number' ? missingTolerance : 10;
      setDetectedExtraIds((prev) => ({
        ...prev,
        [selectedSub.key]: [...(prev[selectedSub.key] ?? []), ...missingSelection],
      }));
      setDetectedTolerances((prev) => ({ ...prev, [selectedSub.key]: tol }));
      setSavingRange(false);
      setMissingModalOpen(false);
      setMissingSelection([]);
      setMissingSearch('');
      showSuccessNotification({
        title: 'Tilføjet',
        message: `${missingSelection.length} posteringer tilføjet — bekræft abonnementet når du er klar`,
      });
    }
  };

  const openMissingModal = () => {
    setMissingSelection([]);
    setMissingSearch('');
    setMissingTolerance(10);
    setMissingModalOpen(true);
  };

  // Reset selection when filter changes
  const handleFilterChange = (f: TFilter) => {
    setFilter(f);
    setSelectedKey(null);
  };

  const openSplitModal = () => {
    if (!selectedSub) return;
    const selectedTxns = selectedSub.transactions.filter((t) => splitSelection.includes(t.id));
    const amounts = selectedTxns.map((t) => Math.abs(t.amount)).sort((a, b) => a - b);
    const mid = Math.floor(amounts.length / 2);
    const median = amounts.length % 2 !== 0 ? amounts[mid] : (amounts[mid - 1] + amounts[mid]) / 2;
    setSplitName(selectedSub.name);
    setSplitMedianAmount(Math.round(median));
    setSplitTolerance(10);
    setSplitModalOpen(true);
  };

  const handleSplitConfirm = async () => {
    if (!selectedSub || splitSelection.length === 0) return;
    setSplittingConfirm(true);
    const { matcherValue } = resolveConfirmArgs(selectedSub);
    const tol = typeof splitTolerance === 'number' ? splitTolerance / 100 : 0.1;
    const amountMin = Math.floor(splitMedianAmount * (1 - tol));
    const amountMax = Math.ceil(splitMedianAmount * (1 + tol));
    const result = await confirmDetection(
      splitName,
      'description_prefix',
      matcherValue,
      getEffectiveCadence(selectedSub),
      amountMin,
      amountMax
    );
    setSplittingConfirm(false);
    if (result) {
      showSuccessNotification({
        title: 'Bekræftet',
        message: `${splitName} er tilføjet som separat abonnement`,
      });
      setSplitModalOpen(false);
      setSplitSelection([]);
      handleFilterChange('confirmed');
      setSelectedKey(`manual:${result.id}`);
    }
  };

  const handleConfirm = async (sub: TDetectedSubscription) => {
    setConfirming(sub.key);
    const extraIds = detectedExtraIds[sub.key] ?? [];
    const storedTol = detectedTolerances[sub.key];
    const extraTxns = transactions.filter((t) => extraIds.includes(t.id));
    // Always use the exact matcher constraints that produced the detected sub
    // (type, value, cadence, amountMin, amountMax) for 1:1 parity
    let matcherType =
      sub.matcherType === 'bs_auto' || sub.matcherType === 'description_prefix'
        ? 'description_prefix'
        : sub.matcherType === 'company_auto' || sub.matcherType === 'company'
          ? 'company'
          : 'description_contains';
    let matcherValue = sub.matcherValue;
    if (matcherType === 'company' && matcherValue.startsWith('company:')) {
      matcherValue = matcherValue.slice('company:'.length);
    }
    const cadence = getEffectiveCadence(sub);
    // If user customized, recalc matcherValue/amounts, else use detected sub's constraints
    let amountMin = null;
    let amountMax = null;
    if (storedTol != null || extraIds.length > 0) {
      const allTxns = refineToSubscriptionTransactions(
        [...sub.transactions, ...extraTxns],
        cadence
      );
      if (sub.matcherType === 'bs_auto') {
        // Recompute LCP from all txns
        const descs = allTxns.map((t) =>
          (t.description ?? t.raw_description ?? '').replace(/^BS\s+/i, '').toLowerCase()
        );
        const lcp = descs.reduce((a, b) => {
          let i = 0;
          while (i < a.length && i < b.length && a[i] === b[i]) i++;
          return a.slice(0, i);
        });
        matcherValue = `bs ${lcp.replace(/[\s\u2013\-\/|]+$/, '').trim()}`;
      }
      const amounts = allTxns.map((t) => Math.abs(t.amount));
      const tol = (storedTol ?? 10) / 100;
      if (tol === 0) {
        amountMin = null;
        amountMax = null;
      } else {
        amountMin = Math.floor(Math.min(...amounts) * (1 - tol));
        amountMax = Math.ceil(Math.max(...amounts) * (1 + tol));
      }
    } else {
      // Always use the detected sub's constraints for ALL matcher types
      const allTxns = refineToSubscriptionTransactions(sub.transactions, cadence);
      const amounts = allTxns.map((t) => Math.abs(t.amount));
      if (amounts.length > 0 && !amounts.every((a) => a === amounts[0])) {
        amountMin = Math.min(...amounts);
        amountMax = Math.max(...amounts);
      } else {
        amountMin = null;
        amountMax = null;
      }
    }
    console.log('[handleConfirm]', {
      key: sub.key,
      matcherType,
      matcherValue,
      amountMin,
      amountMax,
      extraIds,
      storedTol,
    });
    const result = await confirmDetection(
      sub.name,
      matcherType,
      matcherValue,
      cadence,
      amountMin,
      amountMax
    );
    setConfirming(null);
    if (result) {
      await Promise.all([initMatchers(), initTxns({})]);
      showSuccessNotification({
        title: 'Bekræftet',
        message: `${sub.name} er tilføjet til bekræftede abonnementer`,
      });
      handleFilterChange('confirmed');
      setSelectedKey(`manual:${result.id}`);
    } else {
      showErrorNotification({
        title: 'Fejl',
        message:
          'Kunne ikke bekræfte abonnementet. Matcher findes måske allerede eller der opstod en fejl.',
      });
      // eslint-disable-next-line no-console
      console.error('[handleConfirm] confirmDetection failed', {
        name: sub.name,
        matcherType,
        matcherValue,
        cadence,
        amountMin,
        amountMax,
      });
    }
  };

  return (
    <>
      <Group
        align="stretch"
        gap="md"
        style={{ flex: 1, height: '100%', minHeight: 0 }}
        wrap="nowrap"
      >
        {/* Left column: list */}
        <Box
          style={{
            width: 380,
            flexShrink: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Filter tabs */}
          <Group gap={4} mb="xs" wrap="nowrap">
            <UnstyledButton
              style={filterTabStyle(filter === 'confirmed')}
              onClick={() => handleFilterChange('confirmed')}
            >
              <Group gap={6} align="center" wrap="nowrap">
                Bekræftede
                {confirmed.length > 0 && (
                  <Badge variant="light" color="gray" radius="sm" size="xs">
                    {confirmed.length}
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
            <UnstyledButton
              style={filterTabStyle(filter === 'detected')}
              onClick={() => handleFilterChange('detected')}
            >
              <Group gap={6} align="center" wrap="nowrap">
                Opdagede
                {detected.length > 0 && (
                  <Badge variant="light" color="violet" radius="sm" size="xs">
                    {detected.length}
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
            <UnstyledButton
              style={filterTabStyle(filter === 'ignored')}
              onClick={() => handleFilterChange('ignored')}
            >
              <Group gap={6} align="center" wrap="nowrap">
                Ignorerede
                {ignored.length > 0 && (
                  <Badge variant="light" color="gray" radius="sm" size="xs">
                    {ignored.length}
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
          </Group>

          {isLoading ? (
            <Stack align="center" pt="xl">
              <Loader size="sm" />
            </Stack>
          ) : (
            <ScrollArea style={{ flex: 1 }}>
              <Stack gap={4}>
                {(() => {
                  const activeList = list.filter(
                    (s) => getSubscriptionStatus(s, getEffectiveCadence(s)) !== 'cancelled'
                  );
                  const cancelledList = list.filter(
                    (s) => getSubscriptionStatus(s, getEffectiveCadence(s)) === 'cancelled'
                  );
                  const renderRow = (sub: TDetectedSubscription) => {
                    const firstTxn = sub.transactions[0];
                    const isActive = selectedKey === sub.key;
                    const status = getSubscriptionStatus(sub, getEffectiveCadence(sub));
                    const isCancelled = status === 'cancelled';
                    return (
                      <UnstyledButton
                        key={sub.key}
                        onClick={() => setSelectedKey(sub.key)}
                        onMouseEnter={() => setHoveredKey(sub.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        px="sm"
                        py={8}
                        style={{
                          borderRadius: 6,
                          opacity: isCancelled ? 0.45 : 1,
                          background: isActive
                            ? 'var(--mantine-color-violet-0)'
                            : 'var(--mantine-color-default-hover)',
                          border: isActive
                            ? '1px solid var(--mantine-color-violet-3)'
                            : '1px solid transparent',
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                            {firstTxn?.company_name && (
                              <CompanyLogo
                                domain={firstTxn.company_domain}
                                name={firstTxn.company_name}
                                size={28}
                              />
                            )}
                            <Stack gap={1} style={{ minWidth: 0 }}>
                              <Text
                                size="sm"
                                fw={500}
                                truncate
                                style={{
                                  color: isActive ? 'var(--mantine-color-violet-7)' : undefined,
                                }}
                              >
                                {sub.name}
                              </Text>
                              <Group gap={6} wrap="nowrap">
                                <Text size="xs" c="dimmed">
                                  {formatDKK(latestChargeAmount(sub))}/
                                  {CADENCE_PERIOD_LABEL[getEffectiveCadence(sub)]}
                                </Text>
                                {(() => {
                                  const badge = getSourceBadge(sub);
                                  return badge ? (
                                    <Badge
                                      variant="light"
                                      color={badge.color}
                                      size="xs"
                                      radius="sm"
                                    >
                                      {badge.label}
                                    </Badge>
                                  ) : null;
                                })()}
                                {(() => {
                                  const status = getSubscriptionStatus(
                                    sub,
                                    getEffectiveCadence(sub)
                                  );
                                  if (status === 'active') return null;
                                  const s = STATUS_BADGE[status];
                                  return (
                                    <Badge variant="light" color={s.color} size="xs" radius="sm">
                                      {s.label}
                                    </Badge>
                                  );
                                })()}
                              </Group>
                            </Stack>
                          </Group>
                          {filter === 'confirmed' &&
                            (isActive || hoveredKey === sub.key || !!sub.note) && (
                              <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                                <HoverCard
                                  width={280}
                                  position="left"
                                  withArrow
                                  shadow="md"
                                  openDelay={200}
                                  closeDelay={150}
                                >
                                  <HoverCard.Target>
                                    <Box component="span">
                                      <ActionIcon
                                        variant={sub.note ? 'light' : 'subtle'}
                                        color={sub.note ? 'yellow' : 'gray'}
                                        size="sm"
                                        title="Note"
                                      >
                                        <IconNote size={14} stroke={1.5} />
                                      </ActionIcon>
                                    </Box>
                                  </HoverCard.Target>
                                  <HoverCard.Dropdown p={0}>
                                    <Textarea
                                      placeholder="Skriv en note..."
                                      autosize
                                      minRows={3}
                                      maxRows={8}
                                      key={sub.key}
                                      defaultValue={sub.note ?? ''}
                                      onBlur={(e) => {
                                        const val = e.currentTarget.value.trim() || null;
                                        if (val !== (sub.note ?? null)) {
                                          setNote(sub.manualMatcherId!, val);
                                        }
                                      }}
                                      styles={{
                                        input: {
                                          background: '#fefce8',
                                          border: 'none',
                                          borderRadius: 6,
                                          fontSize: 13,
                                          lineHeight: 1.7,
                                          color: '#1c1917',
                                          padding: '10px 12px',
                                          resize: 'none',
                                        },
                                      }}
                                    />
                                  </HoverCard.Dropdown>
                                </HoverCard>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isActive) setSelectedKey(null);
                                    removeMatcher(sub.manualMatcherId!);
                                  }}
                                >
                                  <IconTrash size={14} stroke={1.5} />
                                </ActionIcon>
                              </Group>
                            )}
                          {filter === 'detected' && (
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              title="Ignorer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isActive) setSelectedKey(null);
                                ignoreDetection(sub.key);
                              }}
                            >
                              <IconEyeOff size={14} stroke={1.5} />
                            </ActionIcon>
                          )}
                          {filter === 'ignored' && (
                            <ActionIcon
                              variant="subtle"
                              color="teal"
                              size="sm"
                              title="Gendan"
                              onClick={(e) => {
                                e.stopPropagation();
                                unignoreDetection(sub.key);
                              }}
                            >
                              <IconArrowBack size={14} stroke={1.5} />
                            </ActionIcon>
                          )}
                        </Group>
                      </UnstyledButton>
                    );
                  };
                  return (
                    <>
                      {activeList.map(renderRow)}
                      {cancelledList.length > 0 && (
                        <>
                          <UnstyledButton
                            onClick={() => setCancelledExpanded((v) => !v)}
                            px="sm"
                            py={6}
                            style={{ borderRadius: 6 }}
                          >
                            <Group gap={4}>
                              {cancelledExpanded ? (
                                <IconChevronDown
                                  size={14}
                                  stroke={1.5}
                                  color="var(--mantine-color-dimmed)"
                                />
                              ) : (
                                <IconChevronRight
                                  size={14}
                                  stroke={1.5}
                                  color="var(--mantine-color-dimmed)"
                                />
                              )}
                              <Text size="xs" c="dimmed">
                                Afsluttede ({cancelledList.length})
                              </Text>
                            </Group>
                          </UnstyledButton>
                          {cancelledExpanded && cancelledList.map(renderRow)}
                        </>
                      )}
                      {list.length === 0 && (
                        <Text size="sm" c="dimmed" ta="center" pt="xl">
                          {filter === 'confirmed'
                            ? 'Ingen bekræftede abonnementer'
                            : filter === 'detected'
                              ? 'Ingen opdagede abonnementer'
                              : 'Ingen ignorerede abonnementer'}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </Stack>
            </ScrollArea>
          )}
        </Box>

        {/* Right column: detail */}
        <Paper
          style={{
            flex: 1,
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {!selectedSub ? (
            <Stack align="center" justify="center" style={{ flex: 1 }}>
              <Text size="sm" c="dimmed">
                Vælg et abonnement for at se detaljer
              </Text>
            </Stack>
          ) : (
            <ScrollArea style={{ flex: 1 }} p="sm">
              <Stack gap="md" p="sm">
                {/* Header */}
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap="sm">
                    {selectedSub.transactions[0]?.company_name && (
                      <CompanyLogo
                        domain={selectedSub.transactions[0].company_domain}
                        name={selectedSub.transactions[0].company_name}
                        size={36}
                      />
                    )}
                    <Stack gap={2}>
                      <Text fw={700} size="md">
                        {selectedSub.name}
                      </Text>
                      <Group gap={6} wrap="nowrap">
                        {(() => {
                          const badge = getSourceBadge(selectedSub);
                          return badge ? (
                            <Badge variant="light" color={badge.color} size="sm" radius="sm">
                              {badge.label}
                            </Badge>
                          ) : null;
                        })()}
                        {(() => {
                          const status = getSubscriptionStatus(
                            selectedSub,
                            getEffectiveCadence(selectedSub)
                          );
                          const s = STATUS_BADGE[status];
                          return (
                            <Badge variant="light" color={s.color} size="sm" radius="sm">
                              {s.label}
                            </Badge>
                          );
                        })()}
                        {filter === 'detected' &&
                          (detectedExtraIds[selectedSub.key]?.length > 0 ||
                            detectedTolerances[selectedSub.key] != null) && (
                            <Badge
                              variant="light"
                              color="orange"
                              size="sm"
                              radius="sm"
                              leftSection={<IconAdjustments size={11} stroke={1.5} />}
                            >
                              Tilpasset
                            </Badge>
                          )}
                        {filter === 'confirmed' &&
                          (() => {
                            const matcher = matchers.find(
                              (m) => m.id === selectedSub.manualMatcherId
                            );
                            return matcher?.amount_min != null ? (
                              <Badge
                                variant="light"
                                color="orange"
                                size="sm"
                                radius="sm"
                                leftSection={<IconAdjustments size={11} stroke={1.5} />}
                              >
                                Tilpasset
                              </Badge>
                            ) : null;
                          })()}
                      </Group>
                    </Stack>
                  </Group>
                  {filter === 'confirmed' && selectedSub.manualMatcherId && (
                    <Group gap={6}>
                      <Button
                        leftSection={<IconPlus size={13} stroke={1.5} />}
                        variant="light"
                        color="gray"
                        size="xs"
                        onClick={openMissingModal}
                      >
                        Manglende
                      </Button>
                      <HoverCard
                        width={280}
                        position="bottom-end"
                        withArrow
                        shadow="md"
                        openDelay={200}
                        closeDelay={150}
                      >
                        <HoverCard.Target>
                          <ActionIcon
                            variant={selectedSub.note ? 'light' : 'subtle'}
                            color={selectedSub.note ? 'yellow' : 'gray'}
                            size="md"
                            title="Note"
                          >
                            <IconNote size={14} stroke={1.5} />
                          </ActionIcon>
                        </HoverCard.Target>
                        <HoverCard.Dropdown p={0}>
                          <Textarea
                            placeholder="Skriv en note..."
                            autosize
                            minRows={3}
                            maxRows={8}
                            key={selectedSub.key}
                            defaultValue={selectedSub.note ?? ''}
                            onBlur={(e) => {
                              const val = e.currentTarget.value.trim() || null;
                              if (val !== (selectedSub.note ?? null)) {
                                setNote(selectedSub.manualMatcherId!, val);
                              }
                            }}
                            styles={{
                              input: {
                                background: '#fefce8',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: '#1c1917',
                                padding: '10px 12px',
                                resize: 'none',
                              },
                            }}
                          />
                        </HoverCard.Dropdown>
                      </HoverCard>
                    </Group>
                  )}
                  {filter === 'detected' && (
                    <Group gap="xs">
                      <Button
                        leftSection={<IconPlus size={13} stroke={1.5} />}
                        variant="light"
                        color="gray"
                        size="xs"
                        onClick={openMissingModal}
                      >
                        Manglende
                      </Button>
                      <Button
                        leftSection={<IconEyeOff size={14} stroke={1.5} />}
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={() => {
                          setSelectedKey(null);
                          ignoreDetection(selectedSub.key);
                        }}
                      >
                        Ignorer
                      </Button>
                      <Button
                        leftSection={<IconCheck size={14} stroke={1.5} />}
                        variant="light"
                        color="teal"
                        size="xs"
                        loading={confirming === selectedSub.key}
                        onClick={() => handleConfirm(selectedSub as TDetectedSubscription)}
                      >
                        Bekræft
                      </Button>
                    </Group>
                  )}
                  {filter === 'ignored' && (
                    <Button
                      leftSection={<IconArrowBack size={14} stroke={1.5} />}
                      variant="light"
                      color="teal"
                      size="xs"
                      onClick={() => {
                        unignoreDetection(selectedSub.key);
                        setSelectedKey(null);
                      }}
                    >
                      Gendan
                    </Button>
                  )}
                </Group>

                {/* KPIs */}
                <Group gap="xl" align="flex-start">
                  <Stack gap={2}>
                    <Text
                      size="xs"
                      c="dimmed"
                      tt="uppercase"
                      fw={600}
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Estimat/{CADENCE_PERIOD_LABEL[getEffectiveCadence(selectedSub)]}
                    </Text>
                    <Text fw={700}>{formatDKK(latestChargeAmount(selectedSub))}</Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text
                      size="xs"
                      c="dimmed"
                      tt="uppercase"
                      fw={600}
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Posteringer
                    </Text>
                    <Text fw={700}>{selectedSub.transactions.length}</Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text
                      size="xs"
                      c="dimmed"
                      tt="uppercase"
                      fw={600}
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Senest opkrævet
                    </Text>
                    <Text fw={700}>{formatDate(selectedSub.lastChargedDate)}</Text>
                  </Stack>
                  {filter === 'confirmed' &&
                    (() => {
                      const matcher = matchers.find((m) => m.id === selectedSub.manualMatcherId);
                      if (
                        !matcher?.amount_min ||
                        !matcher?.amount_max ||
                        matcher.amount_min === matcher.amount_max
                      )
                        return null;
                      const avg = (matcher.amount_min + matcher.amount_max) / 2;
                      const tolPct = Math.round(
                        ((matcher.amount_max - matcher.amount_min) / 2 / avg) * 100
                      );
                      if (tolPct === 0) return null;
                      return (
                        <Stack gap={2}>
                          <Text
                            size="xs"
                            c="dimmed"
                            tt="uppercase"
                            fw={600}
                            style={{ letterSpacing: '0.05em' }}
                          >
                            Tolerance
                          </Text>
                          <Text fw={700} size="sm">
                            ±{tolPct} %
                          </Text>
                        </Stack>
                      );
                    })()}
                  {filter === 'detected' && detectedTolerances[selectedSub.key] != null && (
                    <Stack gap={2}>
                      <Text
                        size="xs"
                        c="dimmed"
                        tt="uppercase"
                        fw={600}
                        style={{ letterSpacing: '0.05em' }}
                      >
                        Tolerance
                      </Text>
                      <NumberInput
                        value={detectedTolerances[selectedSub.key]}
                        onChange={(v) =>
                          setDetectedTolerances((prev) => ({
                            ...prev,
                            [selectedSub.key]: typeof v === 'number' ? v : 10,
                          }))
                        }
                        min={0}
                        max={100}
                        suffix=" %"
                        decimalScale={0}
                        size="xs"
                        w={80}
                      />
                    </Stack>
                  )}
                  <Stack gap={2}>
                    <Text
                      size="xs"
                      c="dimmed"
                      tt="uppercase"
                      fw={600}
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Kadence
                    </Text>
                    {selectedSub.source === 'manual' ? (
                      <Select
                        data={CADENCE_OPTIONS}
                        value={selectedSub.cadence}
                        onChange={(v) =>
                          setCadence(
                            selectedSub.manualMatcherId!,
                            (v as TSubscriptionCadence) ?? null
                          )
                        }
                        size="xs"
                        w={150}
                      />
                    ) : (
                      <Select
                        data={CADENCE_OPTIONS}
                        value={getEffectiveCadence(selectedSub)}
                        onChange={(v) => {
                          if (v)
                            setDetectedCadenceOverrides((prev) => ({
                              ...prev,
                              [selectedSub.key]: v as TSubscriptionCadence,
                            }));
                        }}
                        size="xs"
                        w={150}
                      />
                    )}
                  </Stack>
                </Group>

                <Divider />

                {/* Transactions */}
                <Stack gap={4}>
                  {displayTransactions.map((t) => {
                    const isBSAuto = selectedSub.matcherType === 'bs_auto' && filter === 'detected';
                    const isChecked = splitSelection.includes(t.id);
                    return (
                      <UnstyledButton
                        key={t.id}
                        onClick={() => setDrawerTransaction(t)}
                        style={{ borderRadius: 6 }}
                      >
                        <Group
                          justify="space-between"
                          wrap="nowrap"
                          px="sm"
                          py="xs"
                          style={{
                            borderRadius: 6,
                            background: isChecked
                              ? 'var(--mantine-color-violet-0)'
                              : 'var(--mantine-color-default-hover)',
                            border: isChecked
                              ? '1px solid var(--mantine-color-violet-3)'
                              : '1px solid transparent',
                          }}
                        >
                          {isBSAuto && (
                            <Checkbox
                              checked={isChecked}
                              size="xs"
                              onClick={(e) => e.stopPropagation()}
                              onChange={() =>
                                setSplitSelection((prev) =>
                                  prev.includes(t.id)
                                    ? prev.filter((id) => id !== t.id)
                                    : [...prev, t.id]
                                )
                              }
                            />
                          )}
                          <Stack gap={1} style={{ minWidth: 0, flex: 1 }}>
                            <Text size="sm" fw={500} truncate>
                              {t.description}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatDate(t.date)}
                            </Text>
                          </Stack>
                          <Text
                            size="sm"
                            fw={600}
                            c="red.6"
                            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                          >
                            {formatDKK(t.amount)}
                          </Text>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
                {splitSelection.length > 0 && (
                  <Button
                    leftSection={<IconScissors size={14} stroke={1.5} />}
                    variant="light"
                    color="violet"
                    size="xs"
                    fullWidth
                    onClick={openSplitModal}
                  >
                    Opdel {splitSelection.length} valgte som separat abonnement
                  </Button>
                )}
              </Stack>
            </ScrollArea>
          )}
        </Paper>
      </Group>
      <TransactionDrawer
        transaction={drawerTransaction}
        categories={categories}
        segments={segments}
        onClose={() => setDrawerTransaction(null)}
      />

      <Modal
        opened={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        title={<Title order={4}>Opdel som separat abonnement</Title>}
        centered
        size="sm"
        zIndex={300}
      >
        <Stack gap="md" pb="sm">
          <TextInput
            label="Navn"
            value={splitName}
            onChange={(e) => setSplitName(e.currentTarget.value)}
          />
          <NumberInput
            label="Tolerance (%)"
            description={`${formatDKK(Math.floor(splitMedianAmount * (1 - (typeof splitTolerance === 'number' ? splitTolerance / 100 : 0.1))))} – ${formatDKK(Math.ceil(splitMedianAmount * (1 + (typeof splitTolerance === 'number' ? splitTolerance / 100 : 0.1))))}`}
            value={splitTolerance}
            onChange={setSplitTolerance}
            min={0}
            max={100}
            suffix=" %"
            decimalScale={0}
          />
          <Text size="xs" c="dimmed">
            Fremtidige opkrævninger inden for dette beløbsinterval matches med dette abonnement.
          </Text>
          <Button
            loading={splittingConfirm}
            onClick={handleSplitConfirm}
            disabled={!splitName.trim()}
          >
            Bekræft
          </Button>
        </Stack>
      </Modal>

      {selectedSub && (
        <Modal
          opened={missingModalOpen}
          onClose={() => setMissingModalOpen(false)}
          title={<Title order={4}>Tilføj manglende posteringer — {selectedSub.name}</Title>}
          centered
          size="lg"
          zIndex={300}
        >
          <Stack gap="md" pb="sm">
            <TextInput
              placeholder="Søg på beskrivelse eller virksomhed..."
              leftSection={<IconSearch size={14} stroke={1.5} />}
              value={missingSearch}
              onChange={(e) => setMissingSearch(e.currentTarget.value)}
              size="sm"
            />
            <Text size="xs" c="dimmed">
              {filteredMissingCandidates.length} posteringer · {missingSelection.length} valgte
            </Text>
            <div style={{ overflow: 'auto', maxHeight: 360 }}>
              <Stack gap={2}>
                {filteredMissingCandidates.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Ingen posteringer fundet
                  </Text>
                )}
                {filteredMissingCandidates.map((t) => {
                  const checked = missingSelection.includes(t.id);
                  return (
                    <UnstyledButton
                      key={t.id}
                      px="sm"
                      py={7}
                      onClick={() =>
                        setMissingSelection((prev) =>
                          checked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        )
                      }
                      style={{
                        borderRadius: 6,
                        background: checked
                          ? 'var(--mantine-color-violet-0)'
                          : 'var(--mantine-color-default-hover)',
                        border: checked
                          ? '1px solid var(--mantine-color-violet-3)'
                          : '1px solid transparent',
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap" gap="sm">
                        <Checkbox
                          checked={checked}
                          onChange={() => {}}
                          size="xs"
                          style={{ pointerEvents: 'none' }}
                        />
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} truncate>
                            {t.description ?? t.raw_description}
                          </Text>
                          {t.company_name && (
                            <Text size="xs" c="dimmed">
                              {t.company_name}
                            </Text>
                          )}
                        </Stack>
                        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                          {formatDate(t.date)}
                        </Text>
                        <Text
                          size="sm"
                          fw={600}
                          c="red.6"
                          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          {formatDKK(t.amount)}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </div>
            {(() => {
              if (missingSelection.length === 0) return null;
              const selectedTxns = missingCandidates.filter((t) => missingSelection.includes(t.id));
              const allAmounts = [
                ...displayTransactions.map((t) => Math.abs(t.amount)),
                ...selectedTxns.map((t) => Math.abs(t.amount)),
              ];
              const rangeMin = Math.min(...allAmounts);
              const rangeMax = Math.max(...allAmounts);
              const tol = typeof missingTolerance === 'number' ? missingTolerance / 100 : 0.1;
              const previewMin = Math.floor(rangeMin * (1 - tol));
              const previewMax = Math.ceil(rangeMax * (1 + tol));
              return (
                <NumberInput
                  label="Tolerance (%)"
                  description={`Nyt interval: ${formatDKK(previewMin)} – ${formatDKK(previewMax)}`}
                  value={missingTolerance}
                  onChange={setMissingTolerance}
                  min={0}
                  max={100}
                  suffix=" %"
                  decimalScale={0}
                />
              );
            })()}
            <Text size="xs" c="dimmed">
              Beløbsintervallet dækker eksisterende + valgte posteringer med den angivne tolerance.
              {selectedSub.manualMatcherId
                ? ' Fremtidige opkrævninger inden for intervallet inkluderes automatisk.'
                : ' Bekræft abonnementet bagefter for at gemme.'}
            </Text>
            <Button
              loading={savingRange}
              onClick={handleMissingConfirm}
              disabled={missingSelection.length === 0}
            >
              {selectedSub.manualMatcherId
                ? `Opdater interval (${missingSelection.length} valgte)`
                : `Tilføj posteringer (${missingSelection.length} valgte)`}
            </Button>
          </Stack>
        </Modal>
      )}
    </>
  );
}
