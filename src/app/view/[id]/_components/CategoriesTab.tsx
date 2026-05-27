import { useMemo } from 'react';
import { Badge, Group, Stack, Table, Text } from '@mantine/core';
import type { TCategory } from '@/service/database/categories/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';

type TProps = {
  categories: TCategory[];
  transactions: TTransaction[];
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

export const CategoriesTab = ({ categories, transactions }: TProps) => {
  const rows = useMemo(() => {
    return categories
      .map((cat) => {
        const catTx = transactions.filter((t) => t.category_key === cat.key);
        const total = catTx.reduce((s, t) => s + t.amount, 0);
        const count = catTx.length;
        return { ...cat, total, count };
      })
      .sort((a, b) => a.total - b.total);
  }, [categories, transactions]);

  return (
    <Table striped={false} style={{ borderSpacing: '0 4px', borderCollapse: 'separate' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Kategori</Table.Th>
          <Table.Th>Beskrivelse</Table.Th>
          <Table.Th ta="right">Transaktioner</Table.Th>
          <Table.Th ta="right">Total</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((cat) => (
          <Table.Tr key={cat.key}>
            <Table.Td
              style={{
                background: 'var(--mantine-color-default-hover)',
                borderRadius: '6px 0 0 6px',
              }}
            >
              <Group gap="xs">
                <Badge color={cat.color} variant="light" radius="sm" size="sm">
                  {cat.label}
                </Badge>
              </Group>
            </Table.Td>
            <Table.Td style={{ background: 'var(--mantine-color-default-hover)' }}>
              <Text size="sm" c="dimmed">
                {cat.description}
              </Text>
            </Table.Td>
            <Table.Td ta="right" style={{ background: 'var(--mantine-color-default-hover)' }}>
              <Text size="sm" c="dimmed">
                {cat.count}
              </Text>
            </Table.Td>
            <Table.Td
              ta="right"
              style={{
                background: 'var(--mantine-color-default-hover)',
                borderRadius: '0 6px 6px 0',
              }}
            >
              <Text
                size="sm"
                fw={500}
                c={cat.total < 0 ? 'red' : cat.total > 0 ? 'green' : undefined}
              >
                {formatAmount(cat.total)}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};
