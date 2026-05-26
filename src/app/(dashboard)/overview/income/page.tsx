'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconBriefcase,
  IconCalendarEvent,
  IconCalendarStats,
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
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { getAllTransactions, type TTransaction } from '@/service/database/transactions/getAll';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import IncomeDonutChart from '../_components/IncomeDonutChart';
import MonthlyIncomeChart from '../_components/MonthlyIncomeChart';

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
  <Card withBorder p="lg" style={{ height: '100%' }}>
    <Group gap={8} mb={6}>
      {icon && (
        <ThemeIcon size={22} radius="md" variant="light" color="teal">
          {icon}
        </ThemeIcon>
      )}
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
        {label}
      </Text>
    </Group>
    <Text fw={800} style={{ fontSize: 22, letterSpacing: '-0.5px', lineHeight: 1 }} c={valueColor}>
      {value}
    </Text>
    {sub && (
      <Text size="xs" c="dimmed" mt={4}>
        {sub}
      </Text>
    )}
  </Card>
);

export default function IncomeOverviewPage() {
  const { segments = [] } = useCategoriesStore(useShallow((s) => ({ segments: s.segments })));

  const [allTransactions, setAllTransactions] = useState<TTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [interval, setIntervalValue] = useState<string>('12m');

  useEffect(() => {
    useCategoriesStore.getState().initCategories();
    getAllTransactions().then((res) => {
      if (res.success && res.data) setAllTransactions(res.data.filter((t) => !t.is_archived));
      setLoading(false);
    });
  }, []);

  const incomeSegments = useMemo(
    () => segments.filter((s) => s.category_key === 'income'),
    [segments]
  );

  const segmentData = useMemo(
    () => [
      { value: 'all', label: 'Alle segmenter' },
      ...incomeSegments.map((s) => ({ value: s.key, label: s.label })),
    ],
    [incomeSegments]
  );

  const transactions = useMemo(() => {
    let txns = allTransactions.filter((t) => t.amount > 0 && t.category_key === 'income');
    const cutoff = getCutoff(interval);
    if (cutoff) txns = txns.filter((t) => t.date >= cutoff);
    if (selectedSegment !== 'all') txns = txns.filter((t) => t.segment_key === selectedSegment);
    return txns;
  }, [allTransactions, selectedSegment, interval]);

  const { total, monthly, slopePerMonth } = useMemo(() => {
    const total = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + Math.abs(t.amount));
    }
    const months = [...byMonth.keys()].sort();
    const monthly = months.length > 0 ? total / months.length : 0;

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

    return { total, monthly, slopePerMonth };
  }, [transactions]);

  const lønSources = useMemo(() => {
    const lønTxns = allTransactions.filter((t) => t.amount > 0 && t.segment_key === 'salary');
    const cutoff = getCutoff(interval);
    const filtered = cutoff ? lønTxns.filter((t) => t.date >= cutoff) : lønTxns;
    const byName = new Map<
      string,
      { total: number; count: number; latestDate: string; latestAmount: number }
    >();
    for (const t of filtered) {
      const key = t.company_name ?? t.description ?? 'Ukendt';
      const cur = byName.get(key) ?? { total: 0, count: 0, latestDate: '', latestAmount: 0 };
      const amt = Math.abs(t.amount);
      byName.set(key, {
        total: cur.total + amt,
        count: cur.count + 1,
        latestDate: t.date > cur.latestDate ? t.date : cur.latestDate,
        latestAmount: t.date > cur.latestDate ? amt : cur.latestAmount,
      });
    }
    return [...byName.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([label, { total, count, latestDate, latestAmount }]) => ({
        label,
        avg: total / count,
        count,
        latestDate,
        latestAmount,
      }));
  }, [allTransactions, interval]);

  const salaryPayDays = useMemo(() => {
    const salaryTxns = allTransactions.filter((t) => t.amount > 0 && t.segment_key === 'salary');
    const dayCounts = new Map<number, number>();
    for (const t of salaryTxns) {
      const day = parseInt(t.date.slice(8, 10), 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
    const maxCount = Math.max(0, ...dayCounts.values());
    return { dayCounts, maxCount };
  }, [allTransactions]);

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ flex: 1, height: '100%' }}>
        <Loader size="sm" />
      </Stack>
    );
  }

  const trendLabel =
    slopePerMonth != null
      ? `${slopePerMonth >= 0 ? '+' : ''}${slopePerMonth.toFixed(1)} % / md.`
      : '–';
  const trendColor = slopePerMonth == null ? undefined : slopePerMonth > 0 ? 'teal.6' : 'red.6';

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
          Indkomst
        </Title>
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

      <SimpleGrid cols={3} spacing="md" style={{ alignItems: 'stretch' }}>
        <StatCard
          label="Samlet indkomst"
          value={formatDKK(total)}
          sub={`${transactions.length} transaktioner`}
          icon={<IconSum size={16} stroke={1.5} />}
        />
        <StatCard
          label="Månedlig indkomst"
          value={formatDKK(monthly)}
          sub="gennemsnit over perioden"
          icon={<IconCalendarStats size={16} stroke={1.5} />}
        />
        <StatCard
          label="Udvikling"
          value={trendLabel}
          sub={slopePerMonth != null ? 'lineær tendens per måned' : 'kræver min. 3 måneder'}
          valueColor={trendColor}
          icon={<IconTrendingUp size={16} stroke={1.5} />}
        />
      </SimpleGrid>

      <Grid gutter="md" align="stretch">
        <Grid.Col span={8}>
          <Stack gap="md" style={{ height: '100%' }}>
            <MonthlyIncomeChart transactions={transactions} />
            {lønSources.length > 0 && (
              <Card withBorder p="md" style={{ flex: 1 }}>
                <Group gap={8} mb="md">
                  <ThemeIcon size={22} radius="md" variant="light" color="teal">
                    <IconBriefcase size={14} stroke={1.5} />
                  </ThemeIcon>
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={600}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    Lønkilder
                  </Text>
                </Group>
                <Table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Text size="xs" c="dimmed">
                          Kilde
                        </Text>
                      </Table.Th>
                      <Table.Th ta="right">
                        <Text size="xs" c="dimmed">
                          Antal
                        </Text>
                      </Table.Th>
                      <Table.Th ta="right">
                        <Text size="xs" c="dimmed">
                          Gennemsnit
                        </Text>
                      </Table.Th>
                      <Table.Th ta="right">
                        <Text size="xs" c="dimmed">
                          Seneste
                        </Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {lønSources.map((s) => (
                      <Table.Tr
                        key={s.label}
                        style={{ background: 'var(--mantine-color-default-hover)' }}
                      >
                        <Table.Td style={{ borderRadius: '6px 0 0 6px' }}>
                          <Text size="sm" fw={500}>
                            {s.label}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm" c="dimmed">
                            {s.count} gange
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm" fw={600}>
                            {formatDKK(s.avg)}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ borderRadius: '0 6px 6px 0' }} ta="right">
                          <Text size="sm" fw={600}>
                            {formatDKK(s.latestAmount)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Stack>
        </Grid.Col>
        <Grid.Col span={4}>
          <Stack gap="md">
            <IncomeDonutChart
              transactions={transactions}
              segments={segments}
              selectedSegment={selectedSegment}
            />
            {salaryPayDays.maxCount > 0 && (
              <Card withBorder p="md">
                <Group gap={8} mb="xs">
                  <ThemeIcon size={22} radius="md" variant="light" color="teal">
                    <IconCalendarEvent size={14} stroke={1.5} />
                  </ThemeIcon>
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={600}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    Løndag
                  </Text>
                </Group>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const count = salaryPayDays.dayCounts.get(day) ?? 0;
                    const isModal = count === salaryPayDays.maxCount && count > 0;
                    const isActive = count > 0;
                    const shade = isModal
                      ? 8
                      : count >= salaryPayDays.maxCount * 0.66
                        ? 5
                        : count >= salaryPayDays.maxCount * 0.33
                          ? 3
                          : 1;
                    const textColor = shade >= 5 ? 'white' : isActive ? 'teal.9' : 'dimmed';
                    return (
                      <Tooltip
                        key={day}
                        label={isActive ? `${count} gang(e)` : 'Ingen løn'}
                        withArrow
                        position="top"
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isActive
                              ? `var(--mantine-color-teal-${shade})`
                              : 'var(--mantine-color-default-hover)',
                            cursor: isActive ? 'default' : undefined,
                          }}
                        >
                          <Text size="xs" fw={shade >= 5 ? 700 : 400} c={textColor}>
                            {day}
                          </Text>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                {(() => {
                  const topDay = [...salaryPayDays.dayCounts.entries()].sort(
                    (a, b) => b[1] - a[1]
                  )[0]?.[0];
                  if (!topDay) return null;
                  const label = topDay >= 28 ? 'sidst i måneden' : `den ${topDay}. i måneden`;
                  return (
                    <Text size="xs" c="dimmed" mt="sm">
                      Typisk løndag:{' '}
                      <Text span fw={600} c="teal.7">
                        {label}
                      </Text>
                    </Text>
                  );
                })()}
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
