'use client';

import { Drawer, Group, ScrollArea, Stack, Text } from '@mantine/core';
import type { TTransaction } from '@/service/database/transactions/getAll';
import { formatDate } from '@/utilities';

type TProps = {
  title: string;
  transactions: TTransaction[];
  opened: boolean;
  onClose: () => void;
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

const StatTransactionDrawer: React.FC<TProps> = ({ title, transactions, opened, onClose }) => {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Drawer opened={opened} onClose={onClose} title={title} position="right" size="md">
      {sorted.length === 0 ? (
        <Text size="sm" c="dimmed">
          Ingen transaktioner i perioden
        </Text>
      ) : (
        <ScrollArea h="calc(100vh - 80px)">
          <Stack gap={4}>
            {sorted.map((t) => (
              <Group
                key={t.id}
                justify="space-between"
                wrap="nowrap"
                px="sm"
                py="xs"
                style={{
                  borderRadius: 6,
                  background: 'var(--mantine-color-default-hover)',
                }}
              >
                <Stack gap={1} style={{ overflow: 'hidden', flex: 1 }}>
                  <Text
                    size="sm"
                    fw={500}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {t.company_name ?? t.description}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(t.date)}
                  </Text>
                </Stack>
                <Text
                  size="sm"
                  fw={600}
                  c={t.amount < 0 ? 'red.6' : 'teal.6'}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {formatDKK(t.amount)}
                </Text>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Drawer>
  );
};

export default StatTransactionDrawer;
