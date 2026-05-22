'use client';

import { useMemo, useState } from 'react';
import { BarChart } from '@mantine/charts';
import { Group, Select, Text } from '@mantine/core';

type TTransaction = {
  date: string;
  amount: number;
  segment_key: string | null;
};

type TSegment = {
  key: string;
  category_key: string;
  label: string;
};

type TProps = {
  transactions: TTransaction[];
  segments: TSegment[];
  categoryKey: string;
  categoryColor: string;
};

type TInterval = 'all' | '3m' | '6m' | '12m' | 'year';

const INTERVALS: { value: TInterval; label: string }[] = [
  { value: 'all', label: 'Alt' },
  { value: 'year', label: 'Dette år' },
  { value: '12m', label: 'Sidste 12 mdr.' },
  { value: '6m', label: 'Sidste 6 mdr.' },
  { value: '3m', label: 'Sidste 3 mdr.' },
];

const formatDKK = (v: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(v);

const CategorySegmentChart: React.FC<TProps> = ({
  transactions,
  segments,
  categoryKey,
  categoryColor,
}) => {
  const [interval, setInterval] = useState<TInterval>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (interval === 'all') return true;
      const d = new Date(t.date);
      if (interval === 'year') return d.getFullYear() === now.getFullYear();
      const months = interval === '3m' ? 3 : interval === '6m' ? 6 : 12;
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - months);
      return d >= cutoff;
    });
  }, [transactions, interval]);

  const categorySegments = segments.filter((s) => s.category_key === categoryKey);

  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of filtered) {
      const key = t.segment_key ?? 'uncategorized';
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(t.amount));
    }

    const result = categorySegments
      .map((s) => ({ name: s.label, Beløb: Math.round(totals.get(s.key) ?? 0) }))
      .filter((d) => d.Beløb > 0);

    const uncategorized = totals.get('uncategorized') ?? 0;
    if (uncategorized > 0) result.push({ name: 'Ingen', Beløb: Math.round(uncategorized) });

    return result.sort((a, b) => b.Beløb - a.Beløb);
  }, [filtered, categorySegments, categoryKey]);

  if (data.length === 0) return null;

  return (
    <>
      <Group justify="space-between" align="center" mb="xs">
        <Text size="sm" fw={500} c="dimmed">
          Forbrug per segment
        </Text>
        <Select
          size="xs"
          data={INTERVALS}
          value={interval}
          onChange={(v) => setInterval((v as TInterval) ?? 'all')}
          w={140}
          allowDeselect={false}
        />
      </Group>
      <BarChart
        h={160}
        data={data}
        dataKey="name"
        series={[{ name: 'Beløb', color: categoryColor }]}
        withLegend={false}
        withXAxis
        withYAxis
        xAxisProps={{ tick: { fontSize: 11 } }}
        yAxisProps={{
          width: 52,
          tickFormatter: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)),
        }}
        valueFormatter={formatDKK}
        barProps={{ radius: 4 }}
      />
    </>
  );
};

export default CategorySegmentChart;
