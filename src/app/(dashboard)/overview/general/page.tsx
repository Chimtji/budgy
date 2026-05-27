'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconCar,
  IconChartPie,
  IconDeviceTv,
  IconHeartHandshake,
  IconPigMoney,
  IconPizza,
  IconRepeat,
  IconShield,
  IconShoppingBag,
  IconShoppingCart,
  IconTarget,
  IconTrain,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  Card,
  Grid,
  Group,
  Loader,
  RingProgress,
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
import { resolveGoalForMonth, useGoalsStore } from '@/stores/goals/goalsStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import GeneralAreaChart from '../_components/GeneralAreaChart';
import GeneralDonutChart from '../_components/GeneralDonutChart';
import SegmentBreakdownCard, { type TSegmentAmount } from './_components/SegmentBreakdownCard';

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

export default function GeneralOverviewPage() {
  const { categories = [] } = useCategoriesStore(useShallow((s) => ({ categories: s.categories })));
  const matchers = useSubscriptionsStore((s) => s.matchers);
  const goals = useGoalsStore((s) => s.goals);
  const [allTransactions, setAllTransactions] = useState<TTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setIntervalValue] = useState<string>('12m');

  useEffect(() => {
    useCategoriesStore.getState().initCategories();
    useSubscriptionsStore.getState().init();
    useGoalsStore.getState().init();
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

  const {
    carSegments,
    trainSegments,
    foodSegments,
    insuranceSegments,
    takeawaySegments,
    streamingSegments,
    avgSalary,
  } = useMemo(() => {
    const seg = (catKey: string, segKey: string) =>
      transactions
        .filter((t) => t.amount < 0 && t.category_key === catKey && t.segment_key === segKey)
        .reduce((s, t) => s + Math.abs(t.amount), 0) / monthCount;

    const segIncome = (catKey: string, segKey: string) =>
      transactions
        .filter((t) => t.amount > 0 && t.category_key === catKey && t.segment_key === segKey)
        .reduce((s, t) => s + t.amount, 0) / monthCount;

    return {
      carSegments: [
        { key: 'loan', label: 'Billån', color: 'indigo', amount: seg('transport', 'loan') },
        {
          key: 'insurance',
          label: 'Forsikringer',
          color: 'orange',
          amount: seg('transport', 'insurance'),
        },
        { key: 'fuel', label: 'Brændstof', color: 'yellow', amount: seg('transport', 'fuel') },
        {
          key: 'maintenance',
          label: 'Vedligeholdelse',
          color: 'cyan',
          amount: seg('transport', 'maintenance'),
        },
        { key: 'parking', label: 'Parkering', color: 'blue', amount: seg('transport', 'parking') },
        {
          key: 'fines',
          label: 'Bøder & Afgifter',
          color: 'red',
          amount: seg('transport', 'fines'),
        },
      ] as TSegmentAmount[],
      trainSegments: [
        {
          key: 'public',
          label: 'Offentlig transport',
          color: 'blue',
          amount: seg('transport', 'public'),
        },
      ] as TSegmentAmount[],
      foodSegments: [
        {
          key: 'groceries',
          label: 'Dagligvarer',
          color: 'violet',
          amount: seg('groceries', 'groceries'),
        },
      ] as TSegmentAmount[],
      insuranceSegments: [
        {
          key: 'transport',
          label: 'Transport',
          color: 'indigo',
          amount: seg('transport', 'insurance'),
        },
        { key: 'home', label: 'Bolig', color: 'teal', amount: seg('home', 'insurance') },
        {
          key: 'costOfLiving',
          label: 'Leveomkostninger',
          color: 'green',
          amount: seg('costOfLiving', 'insurance'),
        },
        {
          key: 'leisure',
          label: 'Oplevelser',
          color: 'blue',
          amount: seg('experiencesAndLeisure', 'insurance'),
        },
      ] as TSegmentAmount[],
      takeawaySegments: [
        {
          key: 'takeaway',
          label: 'Takeaway & Kantine',
          color: 'orange',
          amount: seg('groceries', 'takeaway'),
        },
        {
          key: 'speciality',
          label: 'Kiosk, Bager & Special',
          color: 'yellow',
          amount: seg('groceries', 'speciality'),
        },
      ] as TSegmentAmount[],
      streamingSegments: [
        {
          key: 'streaming',
          label: 'TV & Streaming',
          color: 'grape',
          amount: seg('experiencesAndLeisure', 'streaming'),
        },
        {
          key: 'software',
          label: 'Online Tjenester & Software',
          color: 'violet',
          amount: seg('experiencesAndLeisure', 'software'),
        },
      ] as TSegmentAmount[],
      avgSalary: segIncome('income', 'salary'),
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

  const budgetScore = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = allTransactions.filter(
      (t) => t.date.startsWith(currentMonth) && t.amount < 0 && !t.is_archived
    );
    const slotKeys = [...new Set(goals.map((g) => `${g.category_key}:${g.segment_key}`))];
    const goalSlots = slotKeys
      .map((k) => {
        const [cat, seg] = k.split(':');
        return resolveGoalForMonth(goals, cat, seg, currentMonth);
      })
      .filter((g): g is NonNullable<typeof g> => g !== null && g.amount_limit > 0);

    if (goalSlots.length === 0) return null;

    const scores = goalSlots.map((goal) => {
      const spent = monthTx
        .filter(
          (t) =>
            t.category_key === goal.category_key &&
            (goal.segment_key === '' || t.segment_key === goal.segment_key)
        )
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      if (spent === 0) return 100;
      return Math.min(100, Math.round((goal.amount_limit / spent) * 100));
    });

    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }, [allTransactions, goals]);

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
          <Stack gap="md">
            <GeneralAreaChart transactions={transactions} />
            <SimpleGrid cols={2} spacing="md">
              <SegmentBreakdownCard
                label="Bil"
                value={formatDKK(carSegments.reduce((s, seg) => s + seg.amount, 0))}
                icon={<IconCar size={14} stroke={1.5} />}
                color="indigo"
                segments={carSegments}
                infoText="Billån, forsikringer, brændstof, vedligeholdelse, parkering og bøder & afgifter under transport."
              />
              <SegmentBreakdownCard
                label="Tog & bus"
                value={formatDKK(trainSegments[0].amount)}
                icon={<IconTrain size={14} stroke={1.5} />}
                color="blue"
                segments={trainSegments}
                infoText="Offentlig transport under transport-kategorien (bus, tog, metro m.m.)."
              />
              <SegmentBreakdownCard
                label="Regninger"
                value={formatDKK(avgSubscriptions)}
                icon={<IconRepeat size={14} stroke={1.5} />}
                color="violet"
                segments={[
                  {
                    key: 'subscriptions',
                    label: 'Abonnementer',
                    color: 'violet',
                    amount: avgSubscriptions,
                  },
                ]}
                infoText="Gennemsnitligt månedligt forbrug på alle registrerede abonnementer."
              />
              <SegmentBreakdownCard
                label="Dagligvarer"
                value={formatDKK(foodSegments[0].amount)}
                icon={<IconShoppingBag size={14} stroke={1.5} />}
                color="violet"
                segments={foodSegments}
                infoText="Dagligvare-segmentet under husholdning."
              />
              <SegmentBreakdownCard
                label="Forsikringer"
                value={formatDKK(insuranceSegments.reduce((s, seg) => s + seg.amount, 0))}
                icon={<IconShield size={14} stroke={1.5} />}
                color="orange"
                segments={insuranceSegments}
                infoText="Forsikringer på tværs af alle kategorier: transport, bolig, leveomkostninger og oplevelser."
              />
              <SegmentBreakdownCard
                label="Takeaway"
                value={formatDKK(takeawaySegments.reduce((s, seg) => s + seg.amount, 0))}
                icon={<IconPizza size={14} stroke={1.5} />}
                color="yellow"
                segments={takeawaySegments}
                infoText="Takeaway & Kantine og Kiosk, Bager & Specialbutikker under husholdning."
              />
              <SegmentBreakdownCard
                label="Streaming & Software"
                value={formatDKK(streamingSegments.reduce((s, seg) => s + seg.amount, 0))}
                icon={<IconDeviceTv size={14} stroke={1.5} />}
                color="grape"
                segments={streamingSegments}
                infoText="TV & Streaming og Online Tjenester & Software under oplevelser & fritid."
              />
              <KpiCard
                label="Rådighedsbeløb"
                value={formatDKK(Math.max(0, avgSalary - avgSubscriptions))}
                sub="løn minus månedlige regninger"
                color="teal"
                icon={<IconWallet size={14} stroke={1.5} />}
              />
            </SimpleGrid>
          </Stack>
        </Grid.Col>
        <Grid.Col span={4}>
          <Stack gap="md">
            <GeneralDonutChart transactions={transactions} categories={categories} />
            <Card withBorder p="md">
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
            <Card withBorder p="md">
              <Group gap={8} mb={8} wrap="nowrap" justify="space-between">
                <Group gap={8} wrap="nowrap">
                  <ThemeIcon size={22} radius="md" variant="light" color="teal">
                    <IconTarget size={14} stroke={1.5} />
                  </ThemeIcon>
                  <Text
                    size="xs"
                    c="dimmed"
                    tt="uppercase"
                    fw={700}
                    style={{ letterSpacing: '0.06em' }}
                  >
                    Budgetscore
                  </Text>
                </Group>
                {budgetScore !== null && (
                  <Text size="xs" c="dimmed">
                    denne måned
                  </Text>
                )}
              </Group>
              {budgetScore === null ? (
                <Text size="sm" c="dimmed">
                  Ingen budgetmål sat endnu
                </Text>
              ) : (
                <Group gap="md" align="center">
                  <RingProgress
                    size={72}
                    thickness={7}
                    roundCaps
                    sections={[
                      {
                        value: budgetScore,
                        color: budgetScore >= 90 ? 'teal' : budgetScore >= 70 ? 'yellow' : 'red',
                      },
                    ]}
                    label={
                      <Text ta="center" fw={800} size="sm" style={{ lineHeight: 1 }}>
                        {budgetScore}
                      </Text>
                    }
                  />
                  <Stack gap={2}>
                    <Text fw={700} size="lg" style={{ lineHeight: 1 }}>
                      {budgetScore}/100
                    </Text>
                    <Text size="xs" c="dimmed">
                      {budgetScore >= 90
                        ? 'Godt klaret!'
                        : budgetScore >= 70
                          ? 'Næsten i mål'
                          : 'Over budget'}
                    </Text>
                  </Stack>
                </Group>
              )}
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
