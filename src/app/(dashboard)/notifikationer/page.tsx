'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  IconArrowRight,
  IconBellOff,
  IconCheck,
  IconTarget,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Badge, Box, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { detectNotifications } from '@/service/notifications/detector';
import { detectGoalNotifications } from '@/service/notifications/goalDetector';
import { useGoalsStore } from '@/stores/goals/goalsStore';
import { useNotificationsStore } from '@/stores/notifications/notificationsStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { formatDate } from '@/utilities';

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const nowYM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function NotifikationerPage() {
  const { transactions, init: initTxns } = useTransactionsStore(
    useShallow((s) => ({ transactions: s.transactions, init: s.init }))
  );
  const { matchers, init: initMatchers } = useSubscriptionsStore(
    useShallow((s) => ({ matchers: s.matchers, init: s.init }))
  );
  const { goals, init: initGoals } = useGoalsStore(
    useShallow((s) => ({ goals: s.goals, init: s.init }))
  );
  const { dismissedIds, dismiss, dismissAll } = useNotificationsStore(
    useShallow((s) => ({
      dismissedIds: s.dismissedIds,
      dismiss: s.dismiss,
      dismissAll: s.dismissAll,
    }))
  );

  useEffect(() => {
    initTxns({});
    initMatchers();
    initGoals();
  }, []);

  const allNotifications = useMemo(
    () => detectNotifications(transactions, matchers),
    [transactions, matchers]
  );

  const currentMonth = useMemo(() => nowYM(), []);
  const allGoalNotifications = useMemo(
    () => detectGoalNotifications(goals, transactions, currentMonth),
    [goals, transactions, currentMonth]
  );

  const activeGoalNotifications = useMemo(
    () => allGoalNotifications.filter((n) => !dismissedIds.includes(n.id)),
    [allGoalNotifications, dismissedIds]
  );

  const active = useMemo(
    () => allNotifications.filter((n) => !dismissedIds.includes(n.id)),
    [allNotifications, dismissedIds]
  );

  const totalActive = active.length + activeGoalNotifications.length;

  const dismissed = useMemo(
    () => allNotifications.filter((n) => dismissedIds.includes(n.id)),
    [allNotifications, dismissedIds]
  );

  return (
    <Stack p="xl" gap="xl">
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Title order={3}>Notifikationer</Title>
          <Text size="sm" c="dimmed">
            Ting der kræver din opmærksomhed
          </Text>
        </Stack>
        {totalActive > 0 && (
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IconBellOff size={14} stroke={1.5} />}
            onClick={() =>
              dismissAll([...active.map((n) => n.id), ...activeGoalNotifications.map((n) => n.id)])
            }
          >
            Afvis alle
          </Button>
        )}
      </Group>

      {active.length === 0 && activeGoalNotifications.length === 0 && (
        <Paper p="xl">
          <Stack align="center" gap="xs" py="xl">
            <Text size="sm" c="dimmed">
              Ingen aktive notifikationer
            </Text>
          </Stack>
        </Paper>
      )}

      <Stack gap="xs">
        {activeGoalNotifications.map((n) => {
          const pct = Math.round((n.spent / n.amountLimit) * 100);
          const color =
            n.threshold === 100
              ? 'red'
              : n.threshold >= 90
                ? 'orange'
                : n.threshold >= 70
                  ? 'yellow'
                  : 'blue';
          return (
            <Paper key={n.id} px="md" py="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                <IconTarget
                  size={28}
                  stroke={1.5}
                  color={`var(--mantine-color-${color}-6)`}
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" align="center" wrap="nowrap">
                    <Text size="sm" fw={600}>
                      {n.goalName}
                    </Text>
                    <Badge variant="light" color={color} radius="sm" size="xs">
                      {pct}% af loft
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {formatDKK(n.spent)} brugt af {formatDKK(n.amountLimit)} loft
                  </Text>
                </Stack>
                <Button
                  variant="light"
                  color="teal"
                  size="xs"
                  leftSection={<IconCheck size={13} stroke={1.5} />}
                  onClick={() => dismiss(n.id)}
                >
                  Kvitter
                </Button>
              </Group>
            </Paper>
          );
        })}
        {active.map((n) => {
          const isPriceIncrease = n.delta > 0;
          const TrendIcon = isPriceIncrease ? IconTrendingUp : IconTrendingDown;
          const trendColor = isPriceIncrease ? 'red' : 'teal';
          const deltaFormatted = `${isPriceIncrease ? '+' : ''}${formatDKK(n.delta)}`;
          const dateFormatted = formatDate(n.transaction.date);

          return (
            <Paper key={n.id} px="md" py="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                <TrendIcon
                  size={28}
                  stroke={1.5}
                  color={`var(--mantine-color-${trendColor}-6)`}
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" align="center" wrap="nowrap">
                    <Text size="sm" fw={600}>
                      {n.subscriptionName}
                    </Text>
                    <Badge variant="light" color={trendColor} radius="sm" size="xs">
                      {isPriceIncrease ? 'Prisstigning' : 'Prisfald'}
                    </Badge>
                    <Box
                      style={{
                        marginLeft: 'auto',
                        background: 'var(--mantine-color-gray-1)',
                        borderRadius: 4,
                        padding: '1px 7px',
                        flexShrink: 0,
                      }}
                    >
                      <Text size="xs" fw={500} c="dimmed">
                        {dateFormatted}
                      </Text>
                    </Box>
                  </Group>
                  <Group gap="xs" align="baseline" wrap="nowrap">
                    <Text size="sm" c="dimmed" style={{ textDecoration: 'line-through' }}>
                      {formatDKK(n.baselineAmount)}
                    </Text>
                    <IconArrowRight
                      size={12}
                      stroke={1.5}
                      color={`var(--mantine-color-${trendColor}-6)`}
                      style={{ flexShrink: 0 }}
                    />
                    <Text size="sm" fw={700} c={`${trendColor}.6`}>
                      {formatDKK(n.chargedAmount)}
                    </Text>
                    <Text size="xs" c={`${trendColor}.6`}>
                      ({deltaFormatted})
                    </Text>
                  </Group>
                  {n.transaction.description && (
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                      {n.transaction.description}
                    </Text>
                  )}
                </Stack>
                <Group gap={6} align="center" style={{ flexShrink: 0 }}>
                  <Button
                    component={Link}
                    href="/subscriptions/list"
                    variant="light"
                    color="violet"
                    size="xs"
                    leftSection={<IconArrowRight size={13} stroke={1.5} />}
                  >
                    Se abonnement
                  </Button>
                  <Button
                    variant="light"
                    color="teal"
                    size="xs"
                    leftSection={<IconCheck size={13} stroke={1.5} />}
                    onClick={() => dismiss(n.id)}
                  >
                    Kvitter
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    leftSection={<IconBellOff size={13} stroke={1.5} />}
                    onClick={() => dismiss(n.id)}
                  >
                    Afvis
                  </Button>
                </Group>
              </Group>
            </Paper>
          );
        })}
      </Stack>

      {dismissed.length > 0 && (
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            Afviste ({dismissed.length})
          </Text>
          {dismissed.map((n) => (
            <Paper key={n.id} p="md" style={{ opacity: 0.5 }}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {n.subscriptionName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDKK(n.chargedAmount)} — {formatDate(n.transaction.date)}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
