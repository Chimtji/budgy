'use client';

import { useMemo } from 'react';
import { DonutChart } from '@mantine/charts';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconChartDonut, IconLayoutList, IconStack2 } from '@tabler/icons-react';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TCategory = { key: string; label: string; color: string };
type TSegment = { key: string; category_key: string; label: string };

type TProps = {
  expenses: TTransaction[];
  categories: TCategory[];
  segments: TSegment[];
  selectedCategory: string;
  selectedSegment: string;
};

const FALLBACK_COLORS = [
  'violet', 'blue', 'teal', 'green', 'yellow', 'orange', 'red', 'pink', 'grape', 'cyan',
];

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const SpendingDonutChart: React.FC<TProps> = ({
  expenses,
  categories,
  segments,
  selectedCategory,
  selectedSegment,
}) => {
  const { data, title } = useMemo(() => {
    if (selectedCategory === 'all') {
      const byCategory = new Map<string, number>();
      for (const t of expenses) {
        const key = t.category_key ?? 'other';
        byCategory.set(key, (byCategory.get(key) ?? 0) + Math.abs(t.amount));
      }
      const visibleCats = categories.filter((c) => c.key !== 'internal' && c.key !== 'income');
      const data = visibleCats
        .map((c, i) => ({
          name: c.label,
          value: Math.round(byCategory.get(c.key) ?? 0),
          color: `${c.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}.6`,
          tooltip: formatDKK(byCategory.get(c.key) ?? 0),
        }))
        .sort((a, b) => b.value - a.value);
      return { data, title: 'Kategorier' };
    }

    if (selectedSegment === 'all') {
      const catSegments = segments.filter((s) => s.category_key === selectedCategory);
      const cat = categories.find((c) => c.key === selectedCategory);
      const bySegment = new Map<string, number>();
      for (const t of expenses) {
        const key = t.segment_key ?? 'none';
        bySegment.set(key, (bySegment.get(key) ?? 0) + Math.abs(t.amount));
      }
      const data = catSegments
        .map((s, i) => ({
          name: s.label,
          value: Math.round(bySegment.get(s.key) ?? 0),
          color: `${cat?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}.${3 + (i % 5)}`,
          tooltip: formatDKK(bySegment.get(s.key) ?? 0),
        }))
        .sort((a, b) => b.value - a.value);
      return { data, title: 'Segmenter' };
    }

    // Group by company/description within selected segment
    const byName = new Map<string, number>();
    for (const t of expenses) {
      const key = t.company_name ?? t.description ?? 'Ukendt';
      byName.set(key, (byName.get(key) ?? 0) + Math.abs(t.amount));
    }
    const cat = categories.find((c) => c.key === selectedCategory);
    const data = [...byName.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value], i) => ({
        name,
        value: Math.round(value),
        color: `${cat?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}.${3 + (i % 5)}`,
        tooltip: formatDKK(value),
      }));
    return { data, title: 'Posteringer' };
  }, [expenses, categories, segments, selectedCategory, selectedSegment]);

  const titleIcon = title === 'Kategorier'
    ? <IconChartDonut size={14} stroke={1.5} />
    : title === 'Segmenter'
    ? <IconStack2 size={14} stroke={1.5} />
    : <IconLayoutList size={14} stroke={1.5} />;

  return (
    <Card withBorder p="md">
      <Group gap={8} mb="sm">
        <ThemeIcon size={22} radius="md" variant="light" color="violet">
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
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: cssVar,
                        flexShrink: 0,
                      }}
                    />
                    <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
                      {item.name}
                    </Text>
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

export default SpendingDonutChart;
