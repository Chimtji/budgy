import { useMemo, useState } from 'react';
import { Badge, Group, Paper, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import type { TCategory } from '@/service/database/categories/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TProps = {
  transactions: TTransaction[];
  categories: TCategory[];
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

export const OverviewTab = ({ transactions, categories }: TProps) => {
  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    return Array.from(set)
      .sort((a, b) => b - a)
      .map(String);
  }, [transactions]);

  const [year, setYear] = useState(years[0] ?? String(new Date().getFullYear()));

  const filtered = useMemo(
    () => transactions.filter((t) => new Date(t.date).getFullYear() === Number(year)),
    [transactions, year]
  );

  const income = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spending = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filtered) {
      if (t.amount >= 0) continue;
      const key = t.category_key ?? '__none__';
      map[key] = (map[key] ?? 0) + t.amount;
    }
    return Object.entries(map)
      .sort((a, b) => a[1] - b[1])
      .map(([key, total]) => ({
        key,
        label: categories.find((c) => c.key === key)?.label ?? 'Ingen kategori',
        color: categories.find((c) => c.key === key)?.color ?? 'gray',
        total,
      }));
  }, [filtered, categories]);

  return (
    <Stack gap="lg">
      <Group justify="flex-end">
        <Select data={years} value={year} onChange={(v) => setYear(v ?? years[0])} w={100} />
      </Group>

      <SimpleGrid cols={3}>
        {[
          { label: 'Indkomst', value: income, color: 'green' },
          { label: 'Udgifter', value: Math.abs(spending), color: 'red' },
          {
            label: 'Netto',
            value: income + spending,
            color: income + spending >= 0 ? 'green' : 'red',
          },
        ].map(({ label, value, color }) => (
          <Paper key={label} withBorder p="md">
            <Text size="sm" c="dimmed">
              {label}
            </Text>
            <Text fw={700} size="xl" c={color}>
              {formatAmount(value)}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Stack gap={6}>
        <Text fw={500} size="sm">
          Udgifter per kategori
        </Text>
        {byCategory.map(({ key, label, color, total }) => (
          <Group
            key={key}
            justify="space-between"
            p="xs"
            style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}
          >
            <Badge color={color} variant="light" radius="sm" size="sm">
              {label}
            </Badge>
            <Text size="sm" fw={500} c="red">
              {formatAmount(Math.abs(total))}
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
};
