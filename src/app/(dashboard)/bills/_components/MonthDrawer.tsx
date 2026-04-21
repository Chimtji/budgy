'use client';

import { Box, Drawer, Group, Stack, Text } from '@mantine/core';
import { getMonthLabel } from '@/data/helpers';
import { TMonthIndex } from '@/data/types';

type MonthDrawerProps = {
  opened: boolean;
  monthIndex: number | null;
  onClose: () => void;
  bills: Record<number, any>;
  onBillSelected?: (bill: any) => void;
};

const MonthDrawer = ({ opened, monthIndex, onClose, bills, onBillSelected }: MonthDrawerProps) => {
  if (!monthIndex) return null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {getMonthLabel(monthIndex as TMonthIndex)}
        </Text>
      }
      position="right"
      size="md"
      transitionProps={{ transition: 'slide-left', duration: 300 }}
    >
      <Stack gap="md">
        {Object.values(bills || {})
          .filter((bill) => bill.due.includes(monthIndex))
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
          .map((bill) => (
            <Box
              key={`${bill.companyName}-${bill.amount}`}
              p="sm"
              bg="dark.8"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: 'var(--mantine-radius-md)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-dark-7)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-dark-8)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              onClick={() => onBillSelected?.(bill)}
            >
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{bill.companyName}</Text>
                <Text fw={500}>
                  {bill.amount < 0 ? '-' : ''}
                  {Math.abs(bill.amount).toLocaleString('da-DK', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}{' '}
                  Kr.
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                {bill.name}
              </Text>
            </Box>
          ))}
      </Stack>
    </Drawer>
  );
};

export default MonthDrawer;
