import { IconInfoCircle } from '@tabler/icons-react';
import { AreaChart } from '@mantine/charts';
import { ActionIcon, Flex, Paper, Stack, Title, Tooltip } from '@mantine/core';
import styles from './IncomeExpenseTrend.module.css';

export const data = [
  { date: 'Januar', income: 2890, expense: 2338, budget: 2452 },
  { date: 'Februar', income: 2756, expense: 2103, budget: 2402 },
  { date: 'Marts', income: 3322, expense: 986, budget: 1821 },
  { date: 'April', income: 3470, expense: 2108, budget: 2809 },
  { date: 'Maj', income: 3129, expense: 1726, budget: 2290 },
  { date: 'Juni', income: 3129, expense: 1726, budget: 2290 },
  { date: 'Juli', income: 3129, expense: 1726, budget: 2290 },
  { date: 'August', income: 3129, expense: 1726, budget: 2290 },
  { date: 'September', income: 3129, expense: 1726, budget: 2290 },
  { date: 'Oktober', income: 3129, expense: 1726, budget: 2290 },
  { date: 'November', income: 3129, expense: 1726, budget: 2290 },
  { date: 'December', income: 3129, expense: 1726, budget: 2290 },
];

const IncomeExpenseTrend = () => {
  return (
    <Paper p={0} pt="sm" radius="md" className={styles.wrapper}>
      <Stack gap={0}>
        <Flex ml="sm" mr="sm" justify="space-between">
          <Title order={3}>Forbrug</Title>
          <Tooltip label="wadadawad" withArrow>
            <ActionIcon variant="transparent" c="dimmed" size="sm">
              <IconInfoCircle />
            </ActionIcon>
          </Tooltip>
        </Flex>
        <AreaChart
          h={300}
          data={data}
          dataKey="date"
          series={[
            { name: 'income', color: 'cyan', label: 'Indtægter' },
            { name: 'expense', color: 'blue', label: 'Udgifter' },
            { name: 'budget', color: 'teal', label: 'Budget' },
          ]}
          yAxisProps={{ hide: true, className: styles.xAxis }}
          xAxisProps={{ hide: true, className: styles.yAxis }}
          curveType="natural"
          tickLine="none"
          gridAxis="none"
          withLegend
        />
      </Stack>
    </Paper>
  );
};

export default IncomeExpenseTrend;
