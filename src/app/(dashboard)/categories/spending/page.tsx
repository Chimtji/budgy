'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconCalendarStats,
  IconChartArea,
  IconChartPie,
  IconReceipt,
  IconRepeat,
  IconShoppingCart,
  IconSum,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  Card,
  Grid,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { getAllTransactions, type TTransaction } from '@/service/database/transactions/getAll';
import { detectSubscriptions } from '@/service/subscriptions/detector';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import MonthlySpendingChart from '../_components/MonthlySpendingChart';
import SpendingDonutChart from '../_components/SpendingDonutChart';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const getCutoff = (interval: string): string | null => {
  const now = new Date();
  switch (interval) {
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10);
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().slice(0, 10);
    case '12m':
      return new Date(now.getFullYear(), now.getMonth() - 12, 1).toISOString().slice(0, 10);
    case 'ytd':
      return `${now.getFullYear()}-01-01`;
    default:
      return null;
  }
};

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, valueColor, icon }) => (
  <Card withBorder p="lg">
    <Group gap={8} mb={8}>
      {icon && (
        <ThemeIcon size={28} radius="md" variant="light" color="violet">
          {icon}
        </ThemeIcon>
      )}
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
        {label}
      </Text>
    </Group>
    <Text fw={800} style={{ fontSize: 28, letterSpacing: '-1px', lineHeight: 1 }} c={valueColor}>
      {value}
    </Text>
    {sub && (
      <Text size="xs" c="dimmed" mt={6}>
        {sub}
      </Text>
    )}
  </Card>
);

type TTopItem = { label: string; primary: string; secondary: string };

const TopList: React.FC<{ title: string; items: TTopItem[]; icon?: React.ReactNode }> = ({
  title,
  items,
  icon,
}) => (
  <Card withBorder p="md">
    <Group gap={8} mb="sm">
      {icon && (
        <ThemeIcon size={22} radius="md" variant="light" color="violet">
          {icon}
        </ThemeIcon>
      )}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
        {title}
      </Text>
    </Group>
    <Stack gap={6}>
      {items.map((item, i) => (
        <Group key={i} justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed" style={{ flexShrink: 0, width: 16 }}>
              {i + 1}
            </Text>
            <Text size="sm" fw={500} truncate>
              {item.label}
            </Text>
          </Group>
          <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
            <Text size="sm" fw={600}>
              {item.primary}
            </Text>
            <Text size="xs" c="dimmed">
              {item.secondary}
            </Text>
          </Stack>
        </Group>
      ))}
      {items.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="sm">
          Ingen data
        </Text>
      )}
    </Stack>
  </Card>
);

export default function SpendingOverviewPage() {
  const { categories = [], segments = [] } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );
  const matchers = useSubscriptionsStore((s) => s.matchers);

  const [allTransactions, setAllTransactions] = useState<TTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [interval, setIntervalValue] = useState<string>('12m');

  useEffect(() => {
    useCategoriesStore.getState().initCategories();
    useSubscriptionsStore.getState().init();
    getAllTransactions().then((res) => {
      if (res.success && res.data) setAllTransactions(res.data.filter((t) => !t.is_archived));
      setLoading(false);
    });
  }, []);

  const categoryData = useMemo(
    () => [
      { value: 'all', label: 'Alle kategorier' },
      ...categories
        .filter((c) => c.key !== 'internal' && c.key !== 'income')
        .map((c) => ({ value: c.key, label: c.label })),
    ],
    [categories]
  );

  const segmentData = useMemo(() => {
    if (selectedCategory === 'all') return [{ value: 'all', label: 'Alle segmenter' }];
    return [
      { value: 'all', label: 'Alle segmenter' },
      ...segments
        .filter((s) => s.category_key === selectedCategory)
        .map((s) => ({ value: s.key, label: s.label })),
    ];
  }, [segments, selectedCategory]);

  const expenses = useMemo(() => {
    let txns = allTransactions.filter(
      (t) =>
        t.amount < 0 &&
        t.category_key &&
        t.category_key !== 'uncategorized' &&
        t.category_key !== 'internal' &&
        t.category_key !== 'income'
    );
    const cutoff = getCutoff(interval);
    if (cutoff) txns = txns.filter((t) => t.date >= cutoff);
    if (selectedCategory !== 'all') txns = txns.filter((t) => t.category_key === selectedCategory);
    if (selectedSegment !== 'all') txns = txns.filter((t) => t.segment_key === selectedSegment);
    return txns;
  }, [allTransactions, selectedCategory, selectedSegment, interval]);

  const { total, monthly, slopePerMonth, lastMonth } = useMemo(() => {
    const total = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    const byMonth = new Map<string, number>();
    for (const t of expenses) {
      const m = t.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + Math.abs(t.amount));
    }
    const months = [...byMonth.keys()].sort();
    const monthly = months.length > 0 ? total / months.length : 0;

    // Linear regression slope over monthly values (x = month index, y = spending)
    let slopePerMonth: number | null = null;
    if (months.length >= 3) {
      const n = months.length;
      const ys = months.map((m) => byMonth.get(m)!);
      const sumX = (n * (n - 1)) / 2;
      const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = ys.reduce((acc, y, i) => acc + i * y, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      slopePerMonth = monthly > 0 ? (slope / monthly) * 100 : null;
    }

    const lastMonth = months.length > 0 ? byMonth.get(months[months.length - 1])! : 0;
    return { total, monthly, slopePerMonth, lastMonth };
  }, [expenses]);

  const { billsTotal, consumptionTotal } = useMemo(() => {
    const subTxnIds = new Set(
      detectSubscriptions(allTransactions, matchers).flatMap((s) => s.transactions.map((t) => t.id))
    );
    const billsTotal = expenses
      .filter((t) => subTxnIds.has(t.id))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const consumptionTotal = expenses
      .filter((t) => !subTxnIds.has(t.id))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return { billsTotal, consumptionTotal };
  }, [expenses, allTransactions, matchers]);

  const topByCount = useMemo((): TTopItem[] => {
    const byName = new Map<string, { total: number; count: number }>();
    for (const t of expenses) {
      const key = t.company_name ?? t.description ?? 'Ukendt';
      const cur = byName.get(key) ?? { total: 0, count: 0 };
      byName.set(key, { total: cur.total + Math.abs(t.amount), count: cur.count + 1 });
    }
    return [...byName.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([label, { total, count }]) => ({
        label,
        primary: `${count} posteringer`,
        secondary: formatDKK(total),
      }));
  }, [expenses]);

  const topBySingleAmount = useMemo((): TTopItem[] => {
    const best = new Map<string, TTransaction>();
    for (const t of expenses) {
      const key = t.company_name ?? t.description ?? 'Ukendt';
      const cur = best.get(key);
      if (!cur || Math.abs(t.amount) > Math.abs(cur.amount)) best.set(key, t);
    }
    return [...best.values()]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5)
      .map((t) => ({
        label: t.company_name ?? t.description ?? 'Ukendt',
        primary: formatDKK(Math.abs(t.amount)),
        secondary: t.date,
      }));
  }, [expenses]);

  if (loading || categories.length === 0) {
    return (
      <Stack align="center" justify="center" style={{ flex: 1, height: '100%' }}>
        <Loader size="sm" />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <Select
          size="xs"
          data={categoryData}
          value={selectedCategory}
          onChange={(v) => {
            setSelectedCategory(v ?? 'all');
            setSelectedSegment('all');
          }}
          style={{ width: 180 }}
          styles={{ input: { fontWeight: 500 } }}
        />
        <Select
          size="xs"
          data={segmentData}
          value={selectedSegment}
          onChange={(v) => setSelectedSegment(v ?? 'all')}
          disabled={selectedCategory === 'all'}
          style={{ width: 180 }}
          styles={{ input: { fontWeight: 500 } }}
        />
        <Select
          size="xs"
          data={[
            { value: '3m', label: 'Seneste 3 mdr.' },
            { value: '6m', label: 'Seneste 6 mdr.' },
            { value: '12m', label: 'Seneste 12 mdr.' },
            { value: 'ytd', label: 'Dette år' },
            { value: 'all', label: 'Alt tid' },
          ]}
          value={interval}
          onChange={(v) => setIntervalValue(v ?? '12m')}
          style={{ width: 180 }}
          styles={{ input: { fontWeight: 500 } }}
        />
      </Group>

      <SimpleGrid cols={4} spacing="md">
        <StatCard
          label="Samlet udgift"
          value={formatDKK(total)}
          sub={`${expenses.length} transaktioner`}
          icon={<IconSum size={16} stroke={1.5} />}
        />
        <StatCard
          label="Månedlig udgift"
          value={formatDKK(monthly)}
          sub="gennemsnit over perioden"
          icon={<IconCalendarStats size={16} stroke={1.5} />}
        />
        <StatCard
          label="Udvikling"
          value={
            slopePerMonth != null
              ? `${slopePerMonth >= 0 ? '+' : ''}${slopePerMonth.toFixed(1)} % / md.`
              : '–'
          }
          sub={slopePerMonth != null ? 'lineær tendens per måned' : 'kræver min. 3 måneder'}
          valueColor={slopePerMonth == null ? undefined : slopePerMonth > 0 ? 'red.6' : 'teal.6'}
          icon={<IconTrendingUp size={16} stroke={1.5} />}
        />
        <StatCard
          label="Regninger vs. forbrug"
          value={
            total > 0
              ? `${Math.round((billsTotal / total) * 100)} % · ${Math.round((consumptionTotal / total) * 100)} %`
              : '–'
          }
          sub={total > 0 ? `${formatDKK(billsTotal)} · ${formatDKK(consumptionTotal)}` : undefined}
          icon={<IconChartPie size={16} stroke={1.5} />}
        />
      </SimpleGrid>

      <Grid gutter="md" align="stretch">
        <Grid.Col span={8}>
          <Stack gap="md">
            <MonthlySpendingChart expenses={expenses} />
            <SimpleGrid cols={2} spacing="md">
              <TopList
                title="Top 5 — flest posteringer"
                items={topByCount}
                icon={<IconRepeat size={14} stroke={1.5} />}
              />
              <TopList
                title="Top 5 — enkeltkøb"
                items={topBySingleAmount}
                icon={<IconShoppingCart size={14} stroke={1.5} />}
              />
            </SimpleGrid>
          </Stack>
        </Grid.Col>
        <Grid.Col span={4}>
          <SpendingDonutChart
            expenses={expenses}
            categories={categories}
            segments={segments}
            selectedCategory={selectedCategory}
            selectedSegment={selectedSegment}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
