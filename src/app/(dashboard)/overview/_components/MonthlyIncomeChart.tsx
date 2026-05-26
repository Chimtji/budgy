'use client';

import { useMemo } from 'react';
import { AreaChart } from '@mantine/charts';
import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconChartArea } from '@tabler/icons-react';
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
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'Maj', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dec',
};

const MonthlyIncomeChart: React.FC<TProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + Math.abs(t.amount));
    }
    return [...byMonth.keys()].sort().map((m) => ({
      month: `${MONTH_LABELS[m.slice(5, 7)]} ${m.slice(2, 4)}`,
      Indkomst: Math.round(byMonth.get(m)!),
    }));
  }, [transactions]);

  if (data.length === 0) return null;

  return (
    <Card withBorder p="md">
      <Group gap={8} mb="sm">
        <ThemeIcon size={22} radius="md" variant="light" color="teal">
          <IconChartArea size={14} stroke={1.5} />
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
          Månedlig indkomst
        </Text>
      </Group>
      <AreaChart
        h={200}
        data={data}
        dataKey="month"
        series={[{ name: 'Indkomst', color: 'teal.6' }]}
        withLegend={false}
        withXAxis
        withYAxis
        xAxisProps={{ tick: { fontSize: 11 } }}
        yAxisProps={{
          width: 60,
          tickFormatter: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)),
        }}
        valueFormatter={formatDKK}
        curveType="monotone"
      />
    </Card>
  );
};

export default MonthlyIncomeChart;
