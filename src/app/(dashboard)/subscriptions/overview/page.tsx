'use client';

import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  Badge,
  Card,
  Grid,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { getAllTransactions } from '@/service/database/transactions/getAll';
import { detectSubscriptions } from '@/service/subscriptions/detector';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { formatDate } from '@/utilities';

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const SOURCE_LABELS: Record<string, string> = {
  bs: 'Betalingsservice',
  recurring: 'Gengående',
  manual: 'Manuel',
};

const SOURCE_COLORS: Record<string, string> = {
  bs: 'violet.5',
  recurring: 'teal.5',
  manual: 'orange.5',
};

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

export default function SubscriptionsOverviewPage() {
  const { matchers, init } = useSubscriptionsStore(
    useShallow((s) => ({ matchers: s.matchers, init: s.init }))
  );
  const {
    transactions,
    isLoading,
    init: initTransactions,
  } = useTransactionsStore(
    useShallow((s) => ({
      transactions: s.transactions,
      isLoading: s.isLoading,
      init: s.init,
    }))
  );

  useEffect(() => {
    init();
    initTransactions();
  }, []);

  const subscriptions = useMemo(
    () => detectSubscriptions(transactions, matchers).filter((s) => s.source === 'manual'),
    [transactions, matchers]
  );

  const totalMonthly = useMemo(
    () => subscriptions.reduce((s, sub) => s + sub.estimatedMonthly, 0),
    [subscriptions]
  );

  const totalAnnual = totalMonthly * 12;

  const donutData = useMemo(() => {
    const bySource = new Map<string, number>();
    for (const sub of subscriptions) {
      bySource.set(sub.source, (bySource.get(sub.source) ?? 0) + sub.estimatedMonthly);
    }
    return [...bySource.entries()].map(([source, value]) => ({
      name: SOURCE_LABELS[source] ?? source,
      value: Math.round(value),
      color: SOURCE_COLORS[source] ?? 'gray.5',
    }));
  }, [subscriptions]);

  const barData = useMemo(
    () =>
      subscriptions
        .slice(0, 12)
        .map((sub) => ({ name: sub.name.slice(0, 20), 'Månedlig kr.': sub.estimatedMonthly }))
        .reverse(),
    [subscriptions]
  );

  if (isLoading) {
    return (
      <Stack align="center" justify="center" style={{ flex: 1, height: '100%' }}>
        <Loader size="sm" />
      </Stack>
    );
  }

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="md">
        {/* KPIs */}
        <SimpleGrid cols={4} spacing="md">
          <StatCard
            label="Samlet månedligt"
            value={formatDKK(totalMonthly)}
            sub="estimeret gennemsnit"
          />
          <StatCard label="Samlet årligt" value={formatDKK(totalAnnual)} sub="estimeret" />
          <StatCard
            label="Antal abonnementer"
            value={String(subscriptions.length)}
            sub={`${subscriptions.filter((s) => s.source === 'bs').length} via Betalingsservice`}
          />
          <StatCard
            label="Gns. pr. abonnement"
            value={
              subscriptions.length > 0
                ? formatDKK(totalMonthly / subscriptions.length)
                : formatDKK(0)
            }
            sub="pr. måned"
          />
        </SimpleGrid>

        {/* Breakdown + Top list */}
        <Grid gutter="md">
          <Grid.Col span={4}>
            <Card withBorder h={300} style={{ display: 'flex', flexDirection: 'column' }}>
              <Text size="sm" fw={600} mb="sm">
                Fordeling efter type
              </Text>
              <DonutChart
                data={donutData.length > 0 ? donutData : [{ name: '–', value: 1, color: 'gray.3' }]}
                h={200}
                mx="auto"
              />
              <Stack gap={4} mt="sm">
                {donutData.map((d) => (
                  <Group key={d.name} justify="space-between">
                    <Text size="xs">{d.name}</Text>
                    <Text size="xs" fw={500}>
                      {formatDKK(d.value)}/md.
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={8}>
            <Card withBorder h={300} style={{ display: 'flex', flexDirection: 'column' }}>
              <Text size="sm" fw={600} mb="sm">
                Top {Math.min(subscriptions.length, 12)} abonnementer
              </Text>
              {barData.length > 0 ? (
                <BarChart
                  data={barData}
                  dataKey="name"
                  series={[{ name: 'Månedlig kr.', color: 'violet.5' }]}
                  h={230}
                  orientation="vertical"
                  gridAxis="x"
                  xAxisProps={{ tickFormatter: (v: number) => `${Math.round(v / 1000)}k` }}
                />
              ) : (
                <Stack align="center" justify="center" style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    Ingen abonnementer fundet
                  </Text>
                </Stack>
              )}
            </Card>
          </Grid.Col>
        </Grid>

        {/* Full list summary */}
        <Card withBorder>
          <Text size="sm" fw={600} mb="sm">
            Alle abonnementer
          </Text>
          <Stack gap={4}>
            {subscriptions.map((sub) => (
              <Group
                key={sub.key}
                justify="space-between"
                px="sm"
                py={6}
                style={{ borderRadius: 6, background: 'var(--mantine-color-default-hover)' }}
              >
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {sub.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Senest: {formatDate(sub.lastChargedDate)} · {sub.transactions.length}{' '}
                    posteringer
                  </Text>
                </Stack>
                <Group gap="sm" style={{ flexShrink: 0 }}>
                  <Badge
                    variant="light"
                    color={
                      sub.source === 'bs' ? 'violet' : sub.source === 'manual' ? 'orange' : 'teal'
                    }
                    size="xs"
                    radius="sm"
                  >
                    {SOURCE_LABELS[sub.source]}
                  </Badge>
                  <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                    {formatDKK(sub.estimatedMonthly)}/md.
                  </Text>
                </Group>
              </Group>
            ))}
            {subscriptions.length === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                Ingen abonnementer fundet
              </Text>
            )}
          </Stack>
        </Card>
      </Stack>
    </ScrollArea>
  );
}
