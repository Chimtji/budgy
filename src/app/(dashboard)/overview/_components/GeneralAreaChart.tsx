'use client';

import { useMemo } from 'react';
import { IconChartArea } from '@tabler/icons-react';
import { CompositeChart } from '@mantine/charts';
import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TProps = {
  transactions: TTransaction[];
};

const formatDKK = (v: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(v);

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Maj',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Dec',
};

const GeneralAreaChart: React.FC<TProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const income = new Map<string, number>();
    const spend = new Map<string, number>();
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      if (t.amount > 0 && t.category_key === 'income') {
        income.set(m, (income.get(m) ?? 0) + Math.abs(t.amount));
      } else if (
        t.amount < 0 &&
        t.category_key !== 'internal' &&
        t.category_key !== 'uncategorized'
      ) {
        spend.set(m, (spend.get(m) ?? 0) + Math.abs(t.amount));
      }
    }
    const months = [...new Set([...income.keys(), ...spend.keys()])].sort();
    return months.map((m) => ({
      month: `${MONTH_LABELS[m.slice(5, 7)]} ${m.slice(2, 4)}`,
      Indkomst: Math.round(income.get(m) ?? 0),
      Udgifter: Math.round(spend.get(m) ?? 0),
    }));
  }, [transactions]);

  if (data.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Group gap={8} mb="sm">
        <ThemeIcon size={22} radius="md" variant="light" color="violet">
          <IconChartArea size={14} stroke={1.5} />
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
          Indkomst vs. udgifter
        </Text>
      </Group>
      <CompositeChart
        h={200}
        data={data}
        dataKey="month"
        series={[
          { name: 'Indkomst', color: 'teal.5', type: 'bar' },
          { name: 'Udgifter', color: 'violet.6', type: 'line' },
        ]}
        withLegend
        withTooltip
        withXAxis
        withYAxis
        xAxisProps={{ tick: { fontSize: 11 } }}
        yAxisProps={{
          width: 60,
          tickFormatter: (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)),
        }}
        valueFormatter={formatDKK}
        curveType="monotone"
        barProps={{ fillOpacity: 0.25, radius: 4 }}
        lineProps={{ strokeWidth: 2 }}
      />
    </Card>
  );
};

export default GeneralAreaChart;
