'use client';

import { use, useEffect } from 'react';
import { IconCalendarWeek, IconCoins, IconMoneybag, IconWallet } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { BarChart } from '@mantine/charts';
import { Box, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { getMonthLabel } from '@/data/helpers';
import { TMonthIndex } from '@/data/types';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import { calculateMonthlyAmounts } from '@/stores/bills/billsStore.helpers';
import BillCardOverview from './_components/BillCardOverview/BillCardOverview';
import BillsTable from './_components/BillsTable/BillsTable';

const Bills = () => {
  const year = useAppStore((state) => state.year);
  const { bills, total, average, highest, lowest, getAllOfYear } = useBillsStore(
    useShallow((state) => ({
      bills: state.bills,
      highest: state.highest,
      lowest: state.lowest,
      average: state.average,
      total: state.total,
      addBill: state.add,
      deleteBill: state.delete,
      getAllOfYear: state.getAllOfYear,
    }))
  );

  const [isScrolled, setIsScrolled] = useToggle([true, false]);

  useEffect(() => {
    getAllOfYear(year);
  }, []);

  const monthlyAmounts = calculateMonthlyAmounts(bills[year]);
  const billsChartData = Object.keys(monthlyAmounts).map((month) => ({
    month: getMonthLabel(parseInt(month) as TMonthIndex),
    amount: monthlyAmounts[parseInt(month) as keyof typeof monthlyAmounts],
  }));

  return (
    <Box w="100%" h="100vh" p="lg">
      <Stack>
        <Box display="grid" style={{ gridTemplateColumns: '3fr 1fr', columnGap: '1em' }}>
          <Paper bg="dark.7" px="xl" py="md" bd="solid 1px dark.7" radius="md">
            <Title order={3} mb="lg">
              Fordeling Overblik
            </Title>
            <BarChart
              onClick={() => setIsScrolled()}
              h={isScrolled ? 100 : 333}
              w={'100%'}
              data={billsChartData}
              dataKey="month"
              style={{ transition: 'height 0.2s ease' }}
              series={[{ name: 'amount', color: 'indigo.6' }]}
              barProps={{
                barSize: 20,
              }}
              gridAxis="x"
              withYAxis={false}
              yAxisProps={{ domain: [lowest - 10, highest] }}
            />
          </Paper>
          <Stack gap={isScrolled ? 0 : 'md'}>
            <BillCardOverview
              condensed={isScrolled}
              value={total}
              description={'Totalt i år'}
              icon={IconMoneybag}
            />
            <BillCardOverview
              condensed={isScrolled}
              value={highest}
              description={'Højeste måned'}
              icon={IconCoins}
            />
            <BillCardOverview
              condensed={isScrolled}
              value={lowest}
              description={'Laveste måned'}
              icon={IconWallet}
            />
            <BillCardOverview
              condensed={isScrolled}
              value={average}
              description={'Gennemsnit pr. måned'}
              icon={IconCalendarWeek}
            />
          </Stack>
        </Box>
        <Paper bg="dark.7" p="xl" bd="solid 1px dark.7" radius="md">
          <BillsTable title="Regninger" bills={bills[year] || {}} />
        </Paper>
      </Stack>
    </Box>
  );
};

export default Bills;
