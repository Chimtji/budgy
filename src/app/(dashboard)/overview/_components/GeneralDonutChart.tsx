'use client';

import { useMemo } from 'react';
import { DonutChart } from '@mantine/charts';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconChartDonut } from '@tabler/icons-react';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TCategory = { key: string; label: string; color: string };

type TProps = {
  transactions: TTransaction[];
  categories: TCategory[];
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const GeneralDonutChart: React.FC<TProps> = ({ transactions, categories }) => {
  const data = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const t of transactions) {
      if (!t.category_key || t.category_key === 'internal' || t.category_key === 'uncategorized') continue;
      if (t.amount >= 0) continue; // only outflows
      byCategory.set(t.category_key, (byCategory.get(t.category_key) ?? 0) + Math.abs(t.amount));
    }
    const catMap = new Map(categories.map((c) => [c.key, c]));
    return categories
      .filter((c) => c.key !== 'internal' && c.key !== 'uncategorized' && c.key !== 'income')
      .map((c) => ({
        name: c.label,
        value: Math.round(byCategory.get(c.key) ?? 0),
        color: `${c.color}.6`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  return (
    <Card withBorder p="md">
      <Group gap={8} mb="sm">
        <ThemeIcon size={22} radius="md" variant="light" color="violet">
          <IconChartDonut size={14} stroke={1.5} />
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
          Kategorier
        </Text>
      </Group>
      <Stack gap="md" align="center">
        <DonutChart data={data} size={140} thickness={20} withTooltip={false} style={{ flexShrink: 0 }} />
        <Stack gap={6} style={{ width: '100%' }}>
          {(() => {
            const total = data.reduce((s, d) => s + d.value, 0);
            return data.map((item) => {
              const [colorName, shade] = item.color.split('.');
              const cssVar = `var(--mantine-color-${colorName}-${shade ?? '6'})`;
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <Group key={item.name} gap="xs" wrap="nowrap">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: cssVar, flexShrink: 0 }} />
                  <Text size="sm" fw={500} truncate style={{ flex: 1 }}>{item.name}</Text>
                  <Group gap={4} style={{ flexShrink: 0 }}>
                    <Text size="xs" c="dimmed">{formatDKK(item.value)}</Text>
                    <Badge variant="light" color="gray" radius="sm" size="sm">{pct} %</Badge>
                  </Group>
                </Group>
              );
            });
          })()}
        </Stack>
      </Stack>
    </Card>
  );
};

export default GeneralDonutChart;
