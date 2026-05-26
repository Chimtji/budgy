'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconChartPie,
  IconCoin,
  IconHeartHandshake,
  IconPigMoney,
  IconReceipt,
  IconRepeat,
  IconShoppingCart,
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
  Title,
} from '@mantine/core';
import { getAllTransactions, type TTransaction } from '@/service/database/transactions/getAll';
import { detectSubscriptions } from '@/service/subscriptions/detector';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import GeneralAreaChart from '../_components/GeneralAreaChart';
import GeneralDonutChart from '../_components/GeneralDonutChart';

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

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, color, icon }) => (
  <Card withBorder p="md" style={{ height: '100%' }}>
    <Group gap={8} mb={6}>
      <ThemeIcon size={22} radius="md" variant="light" color={color}>
        {icon}
      </ThemeIcon>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
        {label}
      </Text>
    </Group>
    <Text fw={800} style={{ fontSize: 22, letterSpacing: '-0.5px', lineHeight: 1 }}>
      {value}
    </Text>
    {sub && (
      <Text size="xs" c="dimmed" mt={4}>
        {sub}
      </Text>
    )}
  </Card>
);

type TStatRow = { label: string; value: string; color: string; icon: React.ReactNode };

const MultiStatCard: React.FC<{ rows: TStatRow[] }> = ({ rows }) => (
  <Card withBorder p="md" style={{ height: '100%' }}>
    <Stack gap="md">
      {rows.map((row) => (
        <Group key={row.label} gap={12} justify="space-between" wrap="nowrap">
          <Group gap={12} wrap="nowrap">
            <ThemeIcon size={32} radius="md" variant="light" color={row.color}>
              {row.icon}
            </ThemeIcon>
            <Text size="md" c="dimmed" fw={500}>
              {row.label}
            </Text>
          </Group>
          <Text fw={700} size="md" style={{ whiteSpace: 'nowrap' }}>
            {row.value}&nbsp;/&nbsp;md.
          </Text>
        </Group>
      ))}
    </Stack>
  </Card>
);

export default function GeneralOverviewPage() {
  const { categories = [] } = useCategoriesStore(useShallow((s) => ({ categories: s.categories })));
  const matchers = useSubscriptionsStore((s) => s.matchers);
  const [allTransactions, setAllTransactions] = useState<TTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setIntervalValue] = useState<string>('12m');

  useEffect(() => {
    useCategoriesStore.getState().initCategories();
    useSubscriptionsStore.getState().init();
    getAllTransactions().then((res) => {
      if (res.success && res.data) setAllTransactions(res.data.filter((t) => !t.is_archived));
      setLoading(false);
    });
  }, []);

  const transactions = useMemo(() => {
    const cutoff = getCutoff(interval);
    return cutoff ? allTransactions.filter((t) => t.date >= cutoff) : allTransactions;
  }, [allTransactions, interval]);

  const { totalIncome, totalSpend, totalInvest, totalCharity } = useMemo(
    () => ({
      totalIncome: transactions
        .filter((t) => t.amount > 0 && t.category_key === 'income')
        .reduce((s, t) => s + t.amount, 0),
      totalSpend: transactions
        .filter(
          (t) =>
            t.amount < 0 &&
            t.category_key &&
            !['income', 'savingsAndInvestments', 'charity', 'internal', 'uncategorized'].includes(
              t.category_key
            )
        )
        .reduce((s, t) => s + Math.abs(t.amount), 0),
      totalInvest: transactions
        .filter((t) => t.amount < 0 && t.category_key === 'savingsAndInvestments')
        .reduce((s, t) => s + Math.abs(t.amount), 0),
      totalCharity: transactions
        .filter((t) => t.amount < 0 && t.category_key === 'charity')
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    }),
    [transactions]
  );

  const monthCount = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return Math.max(1, months.size);
  }, [transactions]);

  const avgByCategory = useMemo(() => {
    const cat = (key: string) =>
      transactions
        .filter((t) => t.amount < 0 && t.category_key === key)
        .reduce((s, t) => s + Math.abs(t.amount), 0) / monthCount;
    const insurance =
      transactions
        .filter((t) => t.amount < 0 && t.segment_key === 'insurance')
        .reduce((s, t) => s + Math.abs(t.amount), 0) / monthCount;
    return {
      transport: cat('transport'),
      food: cat('groceries'),
      insurance,
    };
  }, [transactions, monthCount]);

  const avgSubscriptions = useMemo(() => {
    const subs = detectSubscriptions(allTransactions, matchers);
    const subTxnIds = new Set(subs.flatMap((s) => s.transactions.map((t) => t.id)));
    const cutoff = getCutoff(interval);
    const filtered = allTransactions
      .filter((t) => subTxnIds.has(t.id) && t.amount < 0)
      .filter((t) => !cutoff || t.date >= cutoff);
    return filtered.reduce((s, t) => s + Math.abs(t.amount), 0) / monthCount;
  }, [allTransactions, matchers, interval, monthCount]);

  const totalOut = totalSpend + totalInvest + totalCharity;
  const splitSpend = totalOut > 0 ? Math.round((totalSpend / totalOut) * 100) : 0;
  const splitSave = totalOut > 0 ? Math.round((totalInvest / totalOut) * 100) : 0;
  const splitCharity = totalOut > 0 ? Math.round((totalCharity / totalOut) * 100) : 0;

  if (loading || categories.length === 0) {
    return (
      <Stack align="center" justify="center" style={{ flex: 1, height: '100%' }}>
        <Loader size="sm" />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
          Generelt
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

      <SimpleGrid cols={4} spacing="md" style={{ alignItems: 'stretch' }}>
        <KpiCard
          label="Indkomst"
          value={formatDKK(totalIncome)}
          sub={`${transactions.filter((t) => t.amount > 0 && t.category_key === 'income').length} transaktioner`}
          color="teal"
          icon={<IconTrendingUp size={14} stroke={1.5} />}
        />
        <KpiCard
          label="Udgifter"
          value={formatDKK(totalSpend)}
          sub="forbrug ekskl. opsparing"
          color="violet"
          icon={<IconShoppingCart size={14} stroke={1.5} />}
        />
        <KpiCard
          label="Opsparing & invest"
          value={formatDKK(totalInvest)}
          sub="opsparing & investeringer"
          color="blue"
          icon={<IconPigMoney size={14} stroke={1.5} />}
        />
        <KpiCard
          label="Velgørenhed"
          value={formatDKK(totalCharity)}
          sub="donationer & bidrag"
          color="pink"
          icon={<IconHeartHandshake size={14} stroke={1.5} />}
        />
      </SimpleGrid>

      <Grid gutter="md" align="stretch">
        <Grid.Col span={8}>
          <Stack gap="md" style={{ height: '100%' }}>
            <GeneralAreaChart transactions={transactions} />
            <SimpleGrid cols={2} spacing="md" style={{ flex: 1, alignItems: 'stretch' }}>
              <MultiStatCard
                rows={[
                  {
                    label: 'Regninger',
                    value: formatDKK(avgSubscriptions),
                    color: 'violet',
                    icon: <IconRepeat size={16} stroke={1.5} />,
                  },
                  {
                    label: 'Transport',
                    value: formatDKK(avgByCategory.transport),
                    color: 'blue',
                    icon: <IconCoin size={16} stroke={1.5} />,
                  },
                  {
                    label: 'Mad & husholdning',
                    value: formatDKK(avgByCategory.food),
                    color: 'teal',
                    icon: <IconShoppingCart size={16} stroke={1.5} />,
                  },
                  {
                    label: 'Forsikringer',
                    value: formatDKK(avgByCategory.insurance),
                    color: 'orange',
                    icon: <IconReceipt size={16} stroke={1.5} />,
                  },
                ]}
              />
              <Card withBorder p="md" style={{ height: '100%' }}>
                <Group gap={8} mb="sm">
                  <ThemeIcon size={22} radius="md" variant="light" color="violet">
                    <IconChartPie size={14} stroke={1.5} />
                  </ThemeIcon>
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={700}
                    style={{ letterSpacing: '0.06em' }}
                  >
                    Fordeling af udgifter
                  </Text>
                </Group>
                <Stack gap="sm">
                  <div style={{ display: 'flex', gap: 4, height: 14 }}>
                    <div
                      style={{
                        flex: splitSpend,
                        backgroundColor: 'var(--mantine-color-violet-6)',
                        borderRadius: 4,
                      }}
                    />
                    <div
                      style={{
                        flex: splitSave,
                        backgroundColor: 'var(--mantine-color-cyan-5)',
                        borderRadius: 4,
                      }}
                    />
                    <div
                      style={{
                        flex: splitCharity,
                        backgroundColor: 'var(--mantine-color-red-4)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <Group gap="md">
                    <Group gap={6}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          backgroundColor: 'var(--mantine-color-violet-6)',
                        }}
                      />
                      <Text size="xs" c="dimmed">
                        Forbrug{' '}
                        <Text span fw={600} c="dark">
                          {splitSpend} %
                        </Text>
                      </Text>
                    </Group>
                    <Group gap={6}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          backgroundColor: 'var(--mantine-color-cyan-5)',
                        }}
                      />
                      <Text size="xs" c="dimmed">
                        Opsparing{' '}
                        <Text span fw={600} c="dark">
                          {splitSave} %
                        </Text>
                      </Text>
                    </Group>
                    <Group gap={6}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          backgroundColor: 'var(--mantine-color-red-4)',
                        }}
                      />
                      <Text size="xs" c="dimmed">
                        Velgørenhed{' '}
                        <Text span fw={600} c="dark">
                          {splitCharity} %
                        </Text>
                      </Text>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Grid.Col>
        <Grid.Col span={4}>
          <GeneralDonutChart transactions={transactions} categories={categories} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
