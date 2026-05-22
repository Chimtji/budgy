'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import {
  Badge,
  Card,
  Grid,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { getAllTransactions, type TTransaction } from '@/service/database/transactions/getAll';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { formatDate } from '@/utilities';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Maj',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Dec',
};

const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MONTH_LABELS[m]} ${y.slice(2)}`;
};

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

// Mantine color names that work well for charts
const MANTINE_COLORS = [
  'violet',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'indigo',
  'cyan',
  'grape',
  'lime',
];
const toChartColor = (name: string) => {
  if (name.includes('.')) return name; // already has shade, e.g. 'gray.3'
  if (['gray', 'dark'].includes(name)) return 'gray.5';
  return `${name}.5`;
};

// ─── stat card ──────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <Card withBorder p="md">
    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }} mb={4}>
      {label}
    </Text>
    <Text size="xl" fw={700} style={{ letterSpacing: '-0.5px' }}>
      {value}
    </Text>
    {sub && (
      <Text size="xs" c="dimmed" mt={2}>
        {sub}
      </Text>
    )}
  </Card>
);

// ─── page ────────────────────────────────────────────────────────────────────

export default function CategoriesOverviewPage() {
  const { categories = [], segments = [] } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );

  const [allTransactions, setAllTransactions] = useState<TTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [interval, setIntervalValue] = useState<string>('12m');

  useEffect(() => {
    useCategoriesStore.getState().initCategories();
    getAllTransactions().then((res) => {
      if (res.success && res.data) setAllTransactions(res.data.filter((t) => !t.is_archived));
      setLoading(false);
    });
  }, []);

  // ── dropdown data ────────────────────────────────────────────────────────
  const categoryData = useMemo(
    () => [
      { value: 'all', label: 'Alle kategorier' },
      ...categories
        .filter((c) => c.key !== 'internal')
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

  // ── filtered transactions ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let txns = allTransactions.filter(
      (t) => t.category_key && t.category_key !== 'uncategorized' && t.category_key !== 'internal'
    );
    const cutoff = getCutoff(interval);
    if (cutoff) txns = txns.filter((t) => t.date >= cutoff);
    if (selectedCategory !== 'all') txns = txns.filter((t) => t.category_key === selectedCategory);
    if (selectedSegment !== 'all') txns = txns.filter((t) => t.segment_key === selectedSegment);
    return txns;
  }, [allTransactions, selectedCategory, selectedSegment, interval]);

  const expenses = useMemo(() => filtered.filter((t) => t.amount < 0), [filtered]);
  const income = useMemo(() => filtered.filter((t) => t.amount > 0), [filtered]);

  // ── KPI stats ────────────────────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => expenses.reduce((s, t) => s + Math.abs(t.amount), 0),
    [expenses]
  );
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const uniqueMonths = useMemo(
    () => new Set(expenses.map((t) => t.date.slice(0, 7))).size,
    [expenses]
  );
  const avgPerMonth = uniqueMonths > 0 ? totalExpenses / uniqueMonths : 0;
  const largestExpense = useMemo(
    () =>
      expenses.length > 0
        ? expenses.reduce((max, t) => (Math.abs(t.amount) > max ? Math.abs(t.amount) : max), 0)
        : 0,
    [expenses]
  );

  // ── donut: spending breakdown ─────────────────────────────────────────────
  const donutData = useMemo(() => {
    if (selectedCategory !== 'all') {
      // breakdown by segment within chosen category
      const bySegment = new Map<string, number>();
      for (const t of expenses) {
        const key = t.segment_key ?? '_none';
        bySegment.set(key, (bySegment.get(key) ?? 0) + Math.abs(t.amount));
      }
      return [...bySegment.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, value], idx) => {
          const seg = segments.find((s) => s.key === key && s.category_key === selectedCategory);
          return {
            name: seg?.label ?? key,
            value: Math.round(value),
            color: `${MANTINE_COLORS[idx % MANTINE_COLORS.length]}.5`,
          };
        });
    }

    // breakdown by category
    const byCat = new Map<string, number>();
    for (const t of expenses) {
      const key = t.category_key ?? '_none';
      byCat.set(key, (byCat.get(key) ?? 0) + Math.abs(t.amount));
    }
    return [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => {
        const cat = categories.find((c) => c.key === key);
        return {
          name: cat?.label ?? key,
          value: Math.round(value),
          color: toChartColor(cat?.color ?? 'gray'),
        };
      });
  }, [expenses, categories, segments, selectedCategory]);

  // ── area chart: monthly spending trend ───────────────────────────────────
  const monthlyTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const t of expenses) {
      const m = t.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + Math.abs(t.amount));
    }
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, total]) => ({ month: formatMonth(m), Udgifter: Math.round(total) }));
  }, [expenses]);

  // ── stacked bar: monthly breakdown by category (only when scope = all) ───
  const categoryKeys = useMemo(
    () => [...new Set(expenses.map((t) => t.category_key).filter(Boolean) as string[])],
    [expenses]
  );

  const monthlyCategoryBreakdown = useMemo(() => {
    if (selectedCategory !== 'all') return [];
    const byMonthCat = new Map<string, Map<string, number>>();
    for (const t of expenses) {
      const m = t.date.slice(0, 7);
      const cat = t.category_key ?? '_none';
      if (!byMonthCat.has(m)) byMonthCat.set(m, new Map());
      const catMap = byMonthCat.get(m)!;
      catMap.set(cat, (catMap.get(cat) ?? 0) + Math.abs(t.amount));
    }
    return [...byMonthCat.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, catMap]) => {
        const row: Record<string, string | number> = { month: formatMonth(m) };
        for (const key of categoryKeys) {
          const cat = categories.find((c) => c.key === key);
          row[cat?.label ?? key] = Math.round(catMap.get(key) ?? 0);
        }
        return row;
      });
  }, [expenses, categoryKeys, categories, selectedCategory]);

  const stackedSeries = useMemo(
    () =>
      categoryKeys.map((key, idx) => {
        const cat = categories.find((c) => c.key === key);
        return {
          name: cat?.label ?? key,
          color: toChartColor(cat?.color ?? MANTINE_COLORS[idx % MANTINE_COLORS.length]),
        };
      }),
    [categoryKeys, categories]
  );

  // ── bar chart: day of week pattern ───────────────────────────────────────
  const dayOfWeekData = useMemo(() => {
    const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    for (const t of expenses) {
      const d = new Date(t.date);
      const dow = (d.getDay() + 6) % 7;
      totals[dow] += Math.abs(t.amount);
      counts[dow]++;
    }
    return DAYS.map((day, i) => ({
      day,
      'Gns. udgift': counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    }));
  }, [expenses]);

  // ── bar chart: day of month pattern ──────────────────────────────────────
  const dayOfMonthData = useMemo(() => {
    const totals = new Array(31).fill(0);
    const counts = new Array(31).fill(0);
    for (const t of expenses) {
      const dom = parseInt(t.date.slice(8, 10), 10) - 1;
      totals[dom] += Math.abs(t.amount);
      counts[dom]++;
    }
    return Array.from({ length: 31 }, (_, i) => ({
      dag: String(i + 1),
      'Gns. udgift': counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    }));
  }, [expenses]);

  if (loading || categories.length === 0) {
    return (
      <Stack align="center" justify="center" style={{ flex: 1, height: '100%' }}>
        <Loader size="sm" />
      </Stack>
    );
  }

  const noData = expenses.length === 0;

  return (
    <ScrollArea style={{ height: '100%' }}>
      {/* Filters */}
      <Group gap="sm" mb="md">
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

      {noData ? (
        <Stack align="center" py={80}>
          <Text c="dimmed" size="sm">
            Ingen transaktioner for det valgte filter
          </Text>
        </Stack>
      ) : (
        <Stack gap="md">
          {/* KPI row */}
          <SimpleGrid cols={4} spacing="md">
            <StatCard
              label="Samlet udgift"
              value={formatDKK(totalExpenses)}
              sub={`${expenses.length} transaktioner`}
            />
            <StatCard
              label="Gns. pr. måned"
              value={formatDKK(avgPerMonth)}
              sub={`over ${uniqueMonths} måneder`}
            />
            <StatCard
              label="Samlet indkomst"
              value={formatDKK(totalIncome)}
              sub={`${income.length} posteringer`}
            />
            <StatCard label="Største enkeltudgift" value={formatDKK(largestExpense)} />
          </SimpleGrid>

          {/* Row 2: Donut + Monthly trend */}
          <Grid gutter="md">
            <Grid.Col span={4}>
              <Card withBorder h={320} style={{ display: 'flex', flexDirection: 'column' }}>
                <Text size="sm" fw={600} mb="sm">
                  Fordeling
                </Text>
                <DonutChart
                  data={
                    donutData.length > 0 ? donutData : [{ name: '–', value: 1, color: 'gray.3' }]
                  }
                  h={200}
                  mx="auto"
                />
                <Stack gap={4} mt="sm" style={{ overflow: 'hidden' }}>
                  {donutData.slice(0, 5).map((d) => (
                    <Group key={d.name} justify="space-between" gap="xs">
                      <Group gap={6}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: `var(--mantine-color-${d.color.includes('.') ? d.color.replace('.', '-') : d.color + '-5'})`,
                          }}
                        />
                        <Text size="xs" truncate style={{ maxWidth: 140 }}>
                          {d.name}
                        </Text>
                      </Group>
                      <Text size="xs" fw={500}>
                        {formatDKK(d.value)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={8}>
              <Card withBorder h={320} style={{ display: 'flex', flexDirection: 'column' }}>
                <Text size="sm" fw={600} mb="sm">
                  Månedlig trend
                </Text>
                <AreaChart
                  data={monthlyTrend}
                  dataKey="month"
                  series={[{ name: 'Udgifter', color: 'violet' }]}
                  h={250}
                  curveType="monotone"
                  fillOpacity={0.15}
                  gridAxis="y"
                  withDots={monthlyTrend.length <= 24}
                  yAxisProps={{ tickFormatter: (v: number) => `${Math.round(v / 1000)}k` }}
                />
              </Card>
            </Grid.Col>
          </Grid>

          {/* Row 3: Stacked monthly (all scope) or segment chart */}
          {selectedCategory === 'all' &&
            monthlyCategoryBreakdown.length > 0 &&
            stackedSeries.length > 0 && (
              <Card withBorder>
                <Text size="sm" fw={600} mb="sm">
                  Kategorifordeling pr. måned
                </Text>
                <BarChart
                  data={monthlyCategoryBreakdown}
                  dataKey="month"
                  series={stackedSeries}
                  h={240}
                  type="stacked"
                  gridAxis="y"
                  yAxisProps={{ tickFormatter: (v: number) => `${Math.round(v / 1000)}k` }}
                />
              </Card>
            )}

          {/* Row 4: Spending patterns */}
          <Grid gutter="md">
            <Grid.Col span={5}>
              <Card withBorder>
                <Text size="sm" fw={600} mb="sm">
                  Mønster: ugedag
                </Text>
                <BarChart
                  data={dayOfWeekData}
                  dataKey="day"
                  series={[{ name: 'Gns. udgift', color: 'violet' }]}
                  h={180}
                  gridAxis="y"
                  yAxisProps={{ tickFormatter: (v: number) => `${Math.round(v / 1000)}k` }}
                />
              </Card>
            </Grid.Col>
            <Grid.Col span={7}>
              <Card withBorder>
                <Text size="sm" fw={600} mb="sm">
                  Mønster: dag i måneden
                </Text>
                <BarChart
                  data={dayOfMonthData}
                  dataKey="dag"
                  series={[{ name: 'Gns. udgift', color: 'teal' }]}
                  h={180}
                  gridAxis="y"
                  yAxisProps={{ tickFormatter: (v: number) => `${Math.round(v / 1000)}k` }}
                />
              </Card>
            </Grid.Col>
          </Grid>

          {/* Row 5: Top transactions */}
          <Card withBorder>
            <Text size="sm" fw={600} mb="sm">
              Top 10 største udgifter i denne periode
            </Text>
            <Stack gap={4}>
              {[...expenses]
                .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                .slice(0, 10)
                .map((t) => {
                  const cat = categories.find((c) => c.key === t.category_key);
                  const seg = segments.find(
                    (s) => s.key === t.segment_key && s.category_key === t.category_key
                  );
                  return (
                    <Group
                      key={t.id}
                      justify="space-between"
                      px="sm"
                      py={6}
                      style={{ borderRadius: 6, background: 'var(--mantine-color-default-hover)' }}
                    >
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate>
                          {t.company_name ?? t.description}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(t.date)}
                        </Text>
                      </Stack>
                      <Group gap="sm" style={{ flexShrink: 0 }}>
                        {cat && (
                          <Badge variant="light" color={cat.color} size="xs" radius="sm">
                            {cat.label}
                          </Badge>
                        )}
                        {seg && (
                          <Badge variant="light" color="gray" size="xs" radius="sm">
                            {seg.label}
                          </Badge>
                        )}
                        <Text size="sm" fw={600} c="red.6" style={{ whiteSpace: 'nowrap' }}>
                          {formatDKK(Math.abs(t.amount))}
                        </Text>
                      </Group>
                    </Group>
                  );
                })}
            </Stack>
          </Card>
        </Stack>
      )}
    </ScrollArea>
  );
}
