'use client';

import { useEffect } from 'react';
import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useAppStore } from '@/stores/app/appStore';
import {
  useStatsLoading,
  useStatsMonth,
  useStatsStore,
  useStatsYear,
} from '@/stores/stats/statsStore';
import CategoryBreakdown from './CategoryBreakdown';
import LatestTransactions from './LatestTransactions';
import RecurringVsOneTime from './RecurringVsOneTime';
import TotalSpendCard from './TotalSpendCard';
import TrendChart from './TrendChart';

export default function EconomyOverview() {
  const month = useStatsMonth();
  const year = useStatsYear();
  const isLoading = useStatsLoading();
  const userId = useAppStore((state) => state.userId);
  const fetchStats = useStatsStore((state) => state.actions.fetchStats);
  const setMonth = useStatsStore((state) => state.actions.setMonth);
  const setYear = useStatsStore((state) => state.actions.setYear);

  useEffect(() => {
    if (userId) {
      fetchStats(userId);
    }
  }, [userId, year, month, fetchStats]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthNames = [
    'Januar',
    'Februar',
    'Marts',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'December',
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Text size="lg" fw={700}>
            Økonomi
          </Text>
        </div>
        <Group gap="xs">
          <Button variant="default" size="sm" onClick={handlePreviousMonth} disabled={isLoading}>
            Forrige
          </Button>
          <Text size="sm" fw={500} style={{ minWidth: '120px', textAlign: 'center' }}>
            {monthNames[month - 1]} {year}
          </Text>
          <Button variant="default" size="sm" onClick={handleNextMonth} disabled={isLoading}>
            Næste
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <TotalSpendCard />
        <CategoryBreakdown />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1 }} spacing="lg">
        <TrendChart />
        <RecurringVsOneTime />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1 }} spacing="lg">
        <LatestTransactions />
      </SimpleGrid>
    </Stack>
  );
}
