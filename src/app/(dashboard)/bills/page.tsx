'use client';

import { ForwardRefExoticComponent, RefAttributes } from 'react';
import {
  IconCalendarWeek,
  IconCoin,
  IconCoins,
  IconMoneybag,
  IconProps,
  IconWallet,
} from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { AreaChart, BarChart, CompositeChart } from '@mantine/charts';
import { Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { TBill, useBillsStore } from '@/stores/bills/billsStore';
import Table from '../_components/Table';
import { getMonthWithHighestAmount, summarizeBillsByMonth } from './bills.helpers';

const Bills = () => {
  const { bills, addBill, deleteBill } = useBillsStore(
    useShallow((state) => ({
      bills: state.bills,
      addBill: state.addBill,
      deleteBill: state.deleteBill,
    }))
  );
  const summary = summarizeBillsByMonth(bills);
  const monthWithHighest = getMonthWithHighestAmount(summary);
  const highestAmount = monthWithHighest?.amount || 0;

  const data = summary.map((month) => ({
    ...month,
    amount: month.amount,
  }));

  const columns: { [key in keyof TBill]: { width: string; label: string } } = {
    amount: { width: '100px', label: 'beløb' },
    due: { width: '120px', label: 'betales' },
    company: { width: '150px', label: 'forhandler' },
    category: { width: '120px', label: 'kategori' },
    segment: { width: '120px', label: 'segment' },
  };

  const CardOverview = ({ value, description, icon }: any) => (
    <Paper bg="dark.7" px="md" py="md" bd="solid 1px dark.7" radius="md">
      <Stack gap={0}>
        <Group>
          <ThemeIcon variant="light" size={60}>
            {icon}
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={3}>{value} kr.</Title>
            <Text c="dimmed">{description}</Text>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );

  return (
    <Box w="100%" h="100vh" p="lg">
      <Stack>
        <Box display="grid" style={{ gridTemplateColumns: '3fr 1fr', columnGap: '1em' }}>
          <Paper bg="dark.7" px="xl" py="md" bd="solid 1px dark.7" radius="md">
            <Title order={3} mb="lg">
              Fordeling Overblik
            </Title>
            <BarChart
              h={333}
              data={data}
              dataKey="month"
              series={[{ name: 'amount', color: 'indigo.6' }]}
              // curveType="stepAfter"
              gridAxis="x"
              // withDots={false}
              withYAxis={false}
              yAxisProps={{ domain: [0, highestAmount] }}
            />
          </Paper>
          <Stack>
            <CardOverview
              value={'50.000'}
              description={'Totalt i år'}
              icon={
                <IconMoneybag
                  size={40}
                  stroke={1.2}
                  color={`var(--mantine-primary-color-light-color)`}
                />
              }
            />
            <CardOverview
              value={'50.000'}
              description={'Højeste måned'}
              icon={
                <IconCoins
                  size={40}
                  stroke={1.2}
                  color={`var(--mantine-primary-color-light-color)`}
                />
              }
            />
            <CardOverview
              value={'50.000'}
              description={'Laveste måned'}
              icon={
                <IconWallet
                  size={40}
                  stroke={1.2}
                  color={`var(--mantine-primary-color-light-color)`}
                />
              }
            />
            <CardOverview
              value={'50.000'}
              description={'Gennemsnit pr. måned'}
              icon={
                <IconCalendarWeek
                  size={40}
                  stroke={1.2}
                  color={`var(--mantine-primary-color-light-color)`}
                />
              }
            />
          </Stack>
        </Box>
        <Paper bg="dark.7" p="xl" bd="solid 1px dark.7" radius="md">
          <Table<keyof typeof columns, TBill>
            title="Regninger"
            columns={columns}
            items={bills}
            editable
            editSingle={() => {}}
            onSearch={async (search) => ({})}
            onAdd={addBill}
            onDelete={deleteBill}
            itemTemplate={
              {
                amount: 10,
                due: ['january'],
                company: '--',
                category: 'uncategorized',
                segment: 'uncategorized',
              } as TBill
            }
          />
        </Paper>
      </Stack>
    </Box>
  );
};

export default Bills;
