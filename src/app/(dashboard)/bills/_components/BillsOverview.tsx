'use client';

import { useMemo } from 'react';
import { IconCalendarWeek, IconCoins, IconMoneybag, IconWallet } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { BarChart } from '@mantine/charts';
import { Box } from '@mantine/core';
import { getMonthLabel } from '@/data/helpers';
import { TMonthIndex } from '@/data/types';
import { useBillsStore } from '@/stores/bills/billsStore';
import { calculateMonthlyExpenses } from '@/stores/bills/billsStore.helpers';
import BillCardOverview from './BillCardOverview/BillCardOverview';

type BillsOverviewProps = {
  year: number;
};

const BillsOverview = ({ year }: BillsOverviewProps) => {
  const { bills, total, transferPlan, highest, lowest } = useBillsStore(
    useShallow((state) => ({
      bills: state.bills,
      highest: state.highest,
      lowest: state.lowest,
      transferPlan: state.transferPlan,
      total: state.total,
    }))
  );

  const billsChartData = useMemo(
    () =>
      Object.keys(calculateMonthlyExpenses(bills[year])).map((month) => {
        const monthlyAmounts = calculateMonthlyExpenses(bills[year]);
        return {
          month: getMonthLabel(parseInt(month) as TMonthIndex),
          amount: monthlyAmounts[parseInt(month) as keyof typeof monthlyAmounts],
        };
      }),
    [bills, year]
  );

  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
      }}
    >
      <BarChart
        h={300}
        data={billsChartData}
        dataKey="month"
        series={[{ name: 'amount', color: 'cyan.6', label: 'Udgift' }]}
        withLegend
        gridAxis="none"
        fillOpacity={0.6}
        tickLine="none"
        xAxisProps={{
          tickFormatter: (val, index) => `${index + 1}`,
        }}
        yAxisProps={{
          tickFormatter: (value) => `${Math.round(value / 1000)}k`,
        }}
      />
      <BillCardOverview value={total} description="Totalt i år" icon={IconMoneybag} />
      <BillCardOverview value={highest} description="Højeste måned" icon={IconCoins} />
      <BillCardOverview value={lowest} description="Laveste måned" icon={IconWallet} />
      <BillCardOverview
        value={transferPlan.monthly}
        secondaryValue={transferPlan.start}
        description="Fast Overførsel (første)"
        icon={IconCalendarWeek}
      />
    </Box>
  );
};

export default BillsOverview;
