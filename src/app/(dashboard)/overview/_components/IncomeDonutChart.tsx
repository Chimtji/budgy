'use client';

import { useMemo } from 'react';
import { DonutChart } from '@mantine/charts';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconLayoutList, IconStack2 } from '@tabler/icons-react';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TSegment = { key: string; category_key: string; label: string };

type TProps = {
  transactions: TTransaction[];
  segments: TSegment[];
  selectedSegment: string;
};

const FALLBACK_COLORS = [
  'teal', 'green', 'cyan', 'blue', 'violet', 'grape', 'pink', 'yellow', 'orange', 'red',
];

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const IncomeDonutChart: React.FC<TProps> = ({ transactions, segments, selectedSegment }) => {
  const { data, title } = useMemo(() => {
    const incomeSegments = segments.filter((s) => s.category_key === 'income');
    const segMap = new Map(incomeSegments.map((s) => [s.key, s]));

    if (selectedSegment === 'all') {
      const bySegment = new Map<string, number>();
      for (const t of transactions) {
        const key = t.segment_key ?? 'none';
        bySegment.set(key, (bySegment.get(key) ?? 0) + Math.abs(t.amount));
      }
      const data = incomeSegments
        .map((s, i) => ({
          name: s.label,
          value: Math.round(bySegment.get(s.key) ?? 0),
          color: `${FALLBACK_COLORS[i % FALLBACK_COLORS.length]}.6`,
        }))
        .sort((a, b) => b.value - a.value);
      return { data, title: 'Segmenter' };
    }

    const byName = new Map<string, number>();
    for (const t of transactions) {
      const key = t.company_name ?? t.description ?? 'Ukendt';
      byName.set(key, (byName.get(key) ?? 0) + Math.abs(t.amount));
    }
    const data = [...byName.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({
        name,
        value: Math.round(value),
        color: `${FALLBACK_COLORS[i % FALLBACK_COLORS.length]}.${3 + (i % 5)}`,
      }));
    return { data, title: 'Posteringer' };
  }, [transactions, segments, selectedSegment]);

  const titleIcon = title === 'Segmenter'
    ? <IconStack2 size={14} stroke={1.5} />
    : <IconLayoutList size={14} stroke={1.5} />;

  return (
    <Card withBorder p="md">
      <Group gap={8} mb="sm">
        <ThemeIcon size={22} radius="md" variant="light" color="teal">
          {titleIcon}
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
          {title}
        </Text>
      </Group>
      {data.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="sm">Ingen data</Text>
      ) : (
        <Stack gap="md" align="center">
          <DonutChart
            data={data}
            size={140}
            thickness={20}
            withTooltip={false}
            style={{ flexShrink: 0 }}
          />
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
      )}
    </Card>
  );
};

export default IncomeDonutChart;
