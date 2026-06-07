'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconCar,
  IconChartPie,
  IconDeviceTv,
  IconDroplet,
  IconHanger,
  IconHeartHandshake,
  IconInfoCircle,
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
  Tooltip,
} from '@mantine/core';
import { getAllTransactions, type TTransaction } from '@/service/database/transactions/getAll';
import { detectSubscriptions } from '@/service/subscriptions/detector';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { resolveGoalForMonth, useGoalsStore } from '@/stores/goals/goalsStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import GeneralAreaChart from '../_components/GeneralAreaChart';
import GeneralDonutChart from '../_components/GeneralDonutChart';
import SegmentBreakdownCard, { type TSegmentAmount } from './_components/SegmentBreakdownCard';
import StatRow from './_components/StatRow';
import StatTransactionDrawer from './_components/StatTransactionDrawer';

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const MONTH_LABELS_DK: Record<string, string> = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'Marts',
  '04': 'April',
  '05': 'Maj',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'December',
};

const ms = (year: number, month: number): string => {
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const getCutoff = (interval: string): { from: string | null; to: string | null } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (interval) {
    case '3m':
      return { from: ms(y, m - 2), to: null };
    case '6m':
      return { from: ms(y, m - 5), to: null };
    case '12m':
      return { from: ms(y, m - 11), to: null };
    case 'ytd':
      return { from: `${y}-01-01`, to: null };
    case 'current_month':
      return { from: ms(y, m), to: null };
    case 'last_month':
      return { from: ms(y, m - 1), to: ms(y, m) };
    default: {
      if (/^\d{4}-\d{2}$/.test(interval)) {
        const [sy, sm] = interval.split('-').map(Number);
        return { from: ms(sy, sm - 1), to: ms(sy, sm) };
      }
      return { from: null, to: null };
    }
  }
};

const KpiCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
  infoText?: string;
}> = ({ label, value, sub, color, icon, onClick, infoText }) => (
  <Card
    withBorder
    p="md"
    style={{ height: '100%', cursor: onClick ? 'pointer' : undefined }}
    onClick={onClick}
  >
    <Group justify="space-between" mb={6} wrap="nowrap">
      <Group gap={8} wrap="nowrap">
        <ThemeIcon size={22} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
          {label}
        </Text>
      </Group>
      {infoText && (
        <Tooltip label={infoText} multiline w={220} withArrow position="top-end">
          <IconInfoCircle
            size={15}
            stroke={1.5}
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--mantine-color-gray-5)', cursor: 'default', flexShrink: 0 }}
          />
        </Tooltip>
      )}
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
    const { from, to } = getCutoff(interval);
    return allTransactions.filter((t) => (!from || t.date >= from) && (!to || t.date < to));
  }, [allTransactions, interval]);

  const { totalIncome, totalSpend, totalInvest, totalCharity } = useMemo(
    () => ({
      totalIncome: transactions
        .filter((t) => t.amount > 0 && t.category_key === 'income')
        .reduce((s, t) => s + t.amount, 0),
      totalSpend: transactions
        .filter(
          (t) =>
            t.category_key &&
            !['income', 'savingsAndInvestments', 'charity', 'internal', 'uncategorized'].includes(
              t.category_key
            )
        )
        .reduce((s, t) => s - t.amount, 0),
      totalInvest: transactions
        .filter((t) => t.category_key === 'savingsAndInvestments')
        .reduce((s, t) => s - t.amount, 0),
      totalCharity: transactions
        .filter((t) => t.category_key === 'charity')
        .reduce((s, t) => s - t.amount, 0),
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
        .filter((t) => t.category_key === catKey && t.segment_key === segKey)
        .reduce((s, t) => s - t.amount, 0) / monthCount;

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
    const subs = detectSubscriptions(allTransactions, matchers).filter((s) => s.isManual);
    const subTxnIds = new Set(subs.flatMap((s) => s.transactions.map((t) => t.id)));
    const { from, to } = getCutoff(interval);
    const filtered = allTransactions
      .filter((t) => subTxnIds.has(t.id) && t.amount < 0)
      .filter((t) => (!from || t.date >= from) && (!to || t.date < to));
    return filtered.reduce((s, t) => s + Math.abs(t.amount), 0) / monthCount;
  }, [allTransactions, matchers, interval, monthCount]);

  const subTxns = useMemo(() => {
    const subs = detectSubscriptions(allTransactions, matchers).filter((s) => s.isManual);
    const subTxnIds = new Set(subs.flatMap((s) => s.transactions.map((t) => t.id)));
    const { from, to } = getCutoff(interval);
    return allTransactions
      .filter((t) => subTxnIds.has(t.id) && t.amount < 0)
      .filter((t) => (!from || t.date >= from) && (!to || t.date < to));
  }, [allTransactions, matchers, interval]);

  const clothesSegments = useMemo(
    () =>
      [
        {
          key: 'clothing',
          label: 'Tøj, sko & accessories',
          color: 'pink',
          amount:
            transactions
              .filter((t) => t.category_key === 'costOfLiving' && t.segment_key === 'clothing')
              .reduce((s, t) => s - t.amount, 0) / monthCount,
        },
      ] as TSegmentAmount[],
    [transactions, monthCount]
  );

  const homeUtilitiesSegments = useMemo(
    () =>
      [
        {
          key: 'utilities',
          label: 'Forsyning',
          color: 'cyan',
          amount:
            transactions
              .filter((t) => t.category_key === 'home' && t.segment_key === 'utilities')
              .reduce((s, t) => s - t.amount, 0) / monthCount,
        },
      ] as TSegmentAmount[],
    [transactions, monthCount]
  );

  const cardTxns = useMemo(
    () => ({
      income: transactions.filter((t) => t.amount > 0 && t.category_key === 'income'),
      spend: transactions.filter(
        (t) =>
          t.category_key &&
          !['income', 'savingsAndInvestments', 'charity', 'internal', 'uncategorized'].includes(
            t.category_key
          )
      ),
      invest: transactions.filter((t) => t.category_key === 'savingsAndInvestments'),
      charity: transactions.filter((t) => t.category_key === 'charity'),
      car: transactions.filter(
        (t) =>
          t.amount < 0 &&
          t.category_key === 'transport' &&
          ['loan', 'insurance', 'fuel', 'maintenance', 'parking', 'fines'].includes(
            t.segment_key ?? ''
          )
      ),
      train: transactions.filter(
        (t) => t.amount < 0 && t.category_key === 'transport' && t.segment_key === 'public'
      ),
      food: transactions.filter(
        (t) => t.amount < 0 && t.category_key === 'groceries' && t.segment_key === 'groceries'
      ),
      insurance: transactions.filter((t) => t.amount < 0 && t.segment_key === 'insurance'),
      takeaway: transactions.filter(
        (t) =>
          t.amount < 0 &&
          t.category_key === 'groceries' &&
          ['takeaway', 'speciality'].includes(t.segment_key ?? '')
      ),
      streaming: transactions.filter(
        (t) =>
          t.amount < 0 &&
          t.category_key === 'experiencesAndLeisure' &&
          ['streaming', 'software'].includes(t.segment_key ?? '')
      ),
      salary: transactions.filter(
        (t) => t.amount > 0 && t.category_key === 'income' && t.segment_key === 'salary'
      ),
      clothing: transactions.filter(
        (t) => t.category_key === 'costOfLiving' && t.segment_key === 'clothing'
      ),
      homeUtilities: transactions.filter(
        (t) => t.category_key === 'home' && t.segment_key === 'utilities'
      ),
    }),
    [transactions]
  );

  const totalOut = totalSpend + totalInvest + totalCharity;
  const splitSpend = totalOut > 0 ? Math.round((totalSpend / totalOut) * 100) : 0;
  const splitSave = totalOut > 0 ? Math.round((totalInvest / totalOut) * 100) : 0;
  const splitCharity = totalOut > 0 ? Math.round((totalCharity / totalOut) * 100) : 0;

  const [drawerState, setDrawerState] = useState<{
    title: string;
    transactions: TTransaction[];
  } | null>(null);

  const selectData = useMemo(() => {
    const base = [
      { value: 'current_month', label: 'Denne måned' },
      { value: 'last_month', label: 'Forrige måned' },
      { value: '3m', label: 'Seneste 3 mdr.' },
      { value: '6m', label: 'Seneste 6 mdr.' },
      { value: '12m', label: 'Seneste 12 mdr.' },
      { value: 'ytd', label: 'Dette år' },
      { value: 'all', label: 'Alt tid' },
    ];
    if (/^\d{4}-\d{2}$/.test(interval)) {
      const [sy, sm] = interval.split('-');
      base.unshift({ value: interval, label: `${MONTH_LABELS_DK[sm]} ${sy}` });
    }
    return base;
  }, [interval]);

  const budgetScore = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = allTransactions.filter(
      (t) => t.date.startsWith(currentMonth) && !t.is_archived
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
      const spent = Math.max(
        0,
        monthTx
          .filter(
            (t) =>
              t.category_key === goal.category_key &&
              (goal.segment_key === '' || t.segment_key === goal.segment_key)
          )
          .reduce((s, t) => s - t.amount, 0)
      );
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
      <StatTransactionDrawer
        title={drawerState?.title ?? ''}
        transactions={drawerState?.transactions ?? []}
        opened={drawerState !== null}
        onClose={() => setDrawerState(null)}
      />
      <Group justify="space-between" align="center">
        <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
          Generelt
        </Title>
        <Select
          size="xs"
          data={selectData}
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
          infoText="Alle transaktioner i kategorien Indkomst."
          onClick={() => setDrawerState({ title: 'Indkomst', transactions: cardTxns.income })}
        />
        <KpiCard
          label="Udgifter"
          value={formatDKK(totalSpend)}
          sub="forbrug ekskl. opsparing"
          color="violet"
          icon={<IconShoppingCart size={14} stroke={1.5} />}
          infoText="Alle udgifter ekskl. opsparing & investeringer, velgørenhed, interne overførsler og ukategoriserede."
          onClick={() => setDrawerState({ title: 'Udgifter', transactions: cardTxns.spend })}
        />
        <KpiCard
          label="Opsparing & invest"
          value={formatDKK(totalInvest)}
          sub="opsparing & investeringer"
          color="blue"
          icon={<IconPigMoney size={14} stroke={1.5} />}
          infoText="Transaktioner i kategorien Opsparing & investeringer."
          onClick={() =>
            setDrawerState({ title: 'Opsparing & invest', transactions: cardTxns.invest })
          }
        />
        <KpiCard
          label="Velgørenhed"
          value={formatDKK(totalCharity)}
          sub="donationer & bidrag"
          color="pink"
          icon={<IconHeartHandshake size={14} stroke={1.5} />}
          infoText="Transaktioner i kategorien Velgørenhed."
          onClick={() => setDrawerState({ title: 'Velgørenhed', transactions: cardTxns.charity })}
        />
      </SimpleGrid>

      <Grid gutter="md" align="stretch">
        <Grid.Col span={8}>
          <Stack gap="md">
            <GeneralAreaChart
              transactions={transactions}
              onMonthClick={(key) => setIntervalValue(key)}
            />
            <Card withBorder p="sm">
              <SimpleGrid cols={2} spacing={0}>
                <StatRow
                  label="Bil"
                  value={formatDKK(carSegments.reduce((s, seg) => s + seg.amount, 0))}
                  icon={<IconCar size={14} stroke={1.5} />}
                  color="indigo"
                  segments={carSegments}
                  infoText="Billån, forsikringer, brændstof, vedligeholdelse, parkering og bøder & afgifter under transport."
                  onClick={() => setDrawerState({ title: 'Bil', transactions: cardTxns.car })}
                />
                <StatRow
                  label="Tog & bus"
                  value={formatDKK(trainSegments[0].amount)}
                  icon={<IconTrain size={14} stroke={1.5} />}
                  color="blue"
                  segments={trainSegments}
                  infoText="Offentlig transport under transport-kategorien (bus, tog, metro m.m.)."
                  onClick={() =>
                    setDrawerState({ title: 'Tog & bus', transactions: cardTxns.train })
                  }
                />
                <StatRow
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
                  infoText="Gennemsnitligt månedligt forbrug på alle bekræftede abonnementer."
                  onClick={() => setDrawerState({ title: 'Regninger', transactions: subTxns })}
                />
                <StatRow
                  label="Dagligvarer"
                  value={formatDKK(foodSegments[0].amount)}
                  icon={<IconShoppingBag size={14} stroke={1.5} />}
                  color="violet"
                  segments={foodSegments}
                  infoText="Dagligvare-segmentet under husholdning."
                  onClick={() =>
                    setDrawerState({ title: 'Dagligvarer', transactions: cardTxns.food })
                  }
                />
                <StatRow
                  label="Forsikringer"
                  value={formatDKK(insuranceSegments.reduce((s, seg) => s + seg.amount, 0))}
                  icon={<IconShield size={14} stroke={1.5} />}
                  color="orange"
                  segments={insuranceSegments}
                  infoText="Forsikringer på tværs af alle kategorier: transport, bolig, leveomkostninger og oplevelser."
                  onClick={() =>
                    setDrawerState({ title: 'Forsikringer', transactions: cardTxns.insurance })
                  }
                />
                <StatRow
                  label="Takeaway"
                  value={formatDKK(takeawaySegments.reduce((s, seg) => s + seg.amount, 0))}
                  icon={<IconPizza size={14} stroke={1.5} />}
                  color="yellow"
                  segments={takeawaySegments}
                  infoText="Takeaway & Kantine og Kiosk, Bager & Specialbutikker under husholdning."
                  onClick={() =>
                    setDrawerState({ title: 'Takeaway', transactions: cardTxns.takeaway })
                  }
                />
                <StatRow
                  label="Streaming & Software"
                  value={formatDKK(streamingSegments.reduce((s, seg) => s + seg.amount, 0))}
                  icon={<IconDeviceTv size={14} stroke={1.5} />}
                  color="grape"
                  segments={streamingSegments}
                  infoText="TV & Streaming og Online Tjenester & Software under oplevelser & fritid."
                  onClick={() =>
                    setDrawerState({
                      title: 'Streaming & Software',
                      transactions: cardTxns.streaming,
                    })
                  }
                />
                <StatRow
                  label="Tøj & sko"
                  value={formatDKK(clothesSegments[0].amount)}
                  icon={<IconHanger size={14} stroke={1.5} />}
                  color="pink"
                  segments={clothesSegments}
                  infoText="Tøj, sko & accessories under Leveomkostninger."
                  onClick={() =>
                    setDrawerState({ title: 'Tøj & sko', transactions: cardTxns.clothing })
                  }
                />
                <StatRow
                  label="Bolig forsyning"
                  value={formatDKK(homeUtilitiesSegments[0].amount)}
                  icon={<IconDroplet size={14} stroke={1.5} />}
                  color="cyan"
                  segments={homeUtilitiesSegments}
                  infoText="Forsyning (el, vand, varme m.m.) under Bolig."
                  onClick={() =>
                    setDrawerState({
                      title: 'Bolig forsyning',
                      transactions: cardTxns.homeUtilities,
                    })
                  }
                />
                <StatRow
                  label="Rådighedsbeløb"
                  value={formatDKK(Math.max(0, avgSalary - avgSubscriptions))}
                  icon={<IconWallet size={14} stroke={1.5} />}
                  color="teal"
                  segments={[
                    {
                      key: 'disposable',
                      label: 'Rådighedsbeløb',
                      color: 'teal',
                      amount: Math.max(0, avgSalary - avgSubscriptions),
                    },
                  ]}
                  infoText="Gennemsnitlig månedlig løn minus månedlige bekræftede regninger."
                  onClick={() =>
                    setDrawerState({
                      title: 'Rådighedsbeløb',
                      transactions: [...cardTxns.salary, ...subTxns],
                    })
                  }
                />
              </SimpleGrid>
            </Card>
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
