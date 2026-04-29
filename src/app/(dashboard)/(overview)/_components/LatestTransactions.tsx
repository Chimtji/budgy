'use client';

import { Badge, Card, Center, Group, Loader, Stack, Table, Text } from '@mantine/core';
import categories from '@/data/categories.json';
import { useLatestTransactions } from '@/stores/stats/statsStore';

export default function LatestTransactions() {
  const transactions = useLatestTransactions();

  if (!transactions) {
    return (
      <Card withBorder p="lg">
        <Center h={200}>
          <Loader />
        </Center>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md" align="center">
          <Text c="dimmed">Ingen transaktioner</Text>
        </Stack>
      </Card>
    );
  }

  const rows = transactions.map((tx) => {
    const category = Object.values(categories).find((c) => c.id === tx.categoryId);
    const segment = category ? (category.segments as any)[tx.segmentId] : null;

    const formatDate = (date: string) => new Date(date).toLocaleDateString('da-DK');

    return (
      <Table.Tr key={tx.id}>
        <Table.Td>
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {tx.merchantName}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate(tx.transactionDate)}
            </Text>
          </Stack>
        </Table.Td>
        <Table.Td>
          <Badge size="sm" variant="light">
            {category?.label || 'Ukendt'}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{segment?.label || 'Ukendt'}</Text>
        </Table.Td>
        <Table.Td align="right">
          <Text size="sm" fw={500} c={tx.amount < 0 ? 'red' : 'teal'}>
            {tx.amount.toFixed(2)} kr
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Seneste transaktioner
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>
      </Stack>
    </Card>
  );
}
