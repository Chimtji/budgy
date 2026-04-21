'use client';

import { Box, Card, Group, Stack, Text } from '@mantine/core';
import { getMonthLabel } from '@/data/helpers';
import months from '@/data/months.json';
import { TMonthIndex } from '@/data/types';

type MonthCalendarGridProps = {
  bills: Record<number, any>;
  onViewMore: (monthIndex: number) => void;
};

const MonthCalendarGrid = ({ bills, onViewMore }: MonthCalendarGridProps) => {
  return Object.keys(months).map((index) => {
    const monthIndex = parseInt(index, 10);
    const billsForMonth = Object.values(bills || {})
      .filter((bill) => bill.due.includes(monthIndex))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    return (
      <Card
        key={monthIndex}
        radius="md"
        bg="dark.7"
        withBorder
        style={{ borderColor: 'var(--mantine-color-dark-6)' }}
      >
        <Card.Section inheritPadding withBorder py="md">
          <Group justify="space-between" align="center">
            <Text fw={600} size="md">
              {getMonthLabel(monthIndex as TMonthIndex)}
            </Text>
            {billsForMonth.length > 3 && (
              <Text
                size="sm"
                c="cyan.6"
                fw={500}
                style={{ cursor: 'pointer' }}
                onClick={() => onViewMore(monthIndex)}
              >
                Vis alle ({billsForMonth.length - 3})
              </Text>
            )}
          </Group>
        </Card.Section>
        <Stack gap="xs" mt="md" pb="md" px="md">
          {billsForMonth.slice(0, 3).map((bill) => (
            <Group
              key={`${bill.companyName}-${bill.amount}`}
              justify="space-between"
              align="center"
            >
              <Group gap="xs" align="center">
                <Box w="6px" h="6px" bg="cyan.6" style={{ borderRadius: '50%', flexShrink: 0 }} />
                <Text size="sm" fw={500}>
                  {bill.companyName}
                </Text>
              </Group>
              <Text size="sm" fw={500}>
                {bill.amount < 0 ? '-' : ''}
                {Math.abs(bill.amount).toLocaleString('da-DK', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                Kr.
              </Text>
            </Group>
          ))}
          {billsForMonth.length === 0 && (
            <Text size="sm" c="dimmed" ta="center">
              Ingen regninger
            </Text>
          )}
        </Stack>
      </Card>
    );
  });
};

export default MonthCalendarGrid;
