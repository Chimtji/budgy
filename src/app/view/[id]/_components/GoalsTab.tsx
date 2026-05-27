import { useMemo } from 'react';
import { Badge, Group, Progress, Stack, Table, Text } from '@mantine/core';
import type { TCategory } from '@/service/database/categories/getAll';
import type { TGoal } from '@/service/database/goals/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TProps = {
  goals: TGoal[];
  transactions: TTransaction[];
  categories: TCategory[];
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

export const GoalsTab = ({ goals, transactions, categories }: TProps) => {
  const rows = useMemo(() => {
    return goals.map((g) => {
      const from = new Date(g.effective_from);
      const month = from.toLocaleString('da-DK', { month: 'long', year: 'numeric' });
      const catTx = transactions.filter(
        (t) =>
          t.category_key === g.category_key &&
          (g.segment_key === '' || t.segment_key === g.segment_key) &&
          new Date(t.date) >= from
      );
      const spent = Math.abs(catTx.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
      const pct = Math.min(100, Math.round((spent / g.amount_limit) * 100));
      const cat = categories.find((c) => c.key === g.category_key);
      return { ...g, month, spent, pct, cat };
    });
  }, [goals, transactions, categories]);

  if (rows.length === 0)
    return (
      <Text c="dimmed" size="sm">
        Ingen budgetmål.
      </Text>
    );

  return (
    <Stack gap={12}>
      {rows.map((g) => (
        <Stack
          key={g.id}
          gap={6}
          p="md"
          style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}
        >
          <Group justify="space-between">
            <Group gap="xs">
              {g.cat && (
                <Badge color={g.cat.color} variant="light" radius="sm" size="sm">
                  {g.cat.label}
                </Badge>
              )}
              <Text size="sm" fw={500}>
                {g.name}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              {g.month}
            </Text>
          </Group>
          <Progress value={g.pct} color={g.pct >= 100 ? 'red' : 'violet'} size="sm" />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Brugt: {formatAmount(g.spent)}
            </Text>
            <Text size="xs" c="dimmed">
              Grænse: {formatAmount(g.amount_limit)}
            </Text>
          </Group>
        </Stack>
      ))}
    </Stack>
  );
};
